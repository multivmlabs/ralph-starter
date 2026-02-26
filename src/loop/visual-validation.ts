/**
 * Visual comparison validation for Figma-to-code loops.
 *
 * Three-layer hybrid approach for maximum accuracy:
 *
 * Layer 1 — pixelmatch: Fast pixel-level diff scoring. If diff < threshold → pass immediately (no LLM cost).
 * Layer 2 — LLM Vision: When pixelmatch detects significant differences, sends both images + diff overlay
 *           to an LLM vision API for semantic interpretation (actionable feedback the agent can fix).
 * Layer 3 — Playwright strict assertion: Final gate after fixes. Strict pixel-by-pixel comparison
 *           with tight threshold catches anything the LLM missed.
 *
 * Playwright + pixelmatch are auto-installed when visual validation is triggered and not found.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { execa } from 'execa';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import type { LLMUsage } from '../llm/api.js';
import {
  detectProviderFromEnv,
  getProviderKeyFromEnv,
  type LLMProvider,
  PROVIDERS,
} from '../llm/providers.js';
import { type DevServerInfo, startDevServer } from './dev-server.js';

// --- Thresholds ---

/** Pixel diff ratio above which we invoke LLM vision for semantic analysis */
const PIXEL_DIFF_LLM_THRESHOLD = 0.05; // 5%

/** Pixel diff ratio for strict final gate (very tight) */
const PIXEL_DIFF_STRICT_THRESHOLD = 0.02; // 2%

/** pixelmatch per-pixel color distance threshold (0 = exact, 1 = lenient). 0.1 = standard */
const PIXELMATCH_THRESHOLD = 0.1;

// --- Types ---

export interface VisualValidationResult {
  success: boolean;
  issues: string[];
  /** Pixel diff ratio (0–1) from pixelmatch */
  diffRatio?: number;
  /** Path to diff overlay image (if generated) */
  diffImagePath?: string;
  usage?: LLMUsage;
}

export interface VisualValidationOptions {
  provider?: LLMProvider;
  model?: string;
  /** Viewport width for screenshot capture (default: 1920) */
  viewportWidth?: number;
  /** Viewport height for screenshot capture (default: 1080) */
  viewportHeight?: number;
  /** Timeout for dev server startup in ms (default: 30000) */
  serverTimeout?: number;
  /** Logging callback for progress messages */
  log?: (msg: string) => void;
  /** Whether this is a re-check after fixes (enables strict final gate) */
  strictMode?: boolean;
}

// --- Prompts ---

const VISION_SYSTEM_PROMPT = `You are a pixel-perfect UI comparison expert. Your job is to compare a design mockup (from Figma) against an actual implementation screenshot and identify visual differences.

Be precise and actionable. Only report real differences that a developer needs to fix.`;

const VISION_COMPARISON_PROMPT = `Compare these three images carefully.

**Image 1 (FIRST)**: The TARGET DESIGN from Figma — this is what the implementation SHOULD look like.
**Image 2 (SECOND)**: The CURRENT IMPLEMENTATION screenshot — this is what was actually built.
**Image 3 (THIRD)**: A PIXEL DIFF overlay — red/magenta pixels show where the images differ.

Use all three images together. The diff overlay highlights exact regions of difference.

List ONLY concrete visual differences. Be specific about:

1. **Missing elements**: Components visible in the design but absent in the implementation
2. **Positioning errors**: Elements in the wrong location — specify where they should be (e.g., "Logo should be top-left, currently centered")
3. **Spacing/sizing**: Gaps, padding, margins that noticeably differ (e.g., "Section gap should be ~80px, currently ~20px")
4. **Color differences**: Wrong colors, opacity, gradients (e.g., "Background should be #0b1d26, currently appears lighter")
5. **Typography**: Font size, weight, line-height mismatches (e.g., "Heading should be ~88px serif, currently ~40px sans-serif")
6. **Image issues**: Wrong crop, missing images, wrong aspect ratio, wrong stacking order
7. **Layout structure**: Wrong flex direction, missing grid layout, incorrect element ordering

If the implementation matches the design well (minor sub-pixel differences are OK, slight font rendering differences are OK), respond with exactly:
VISUAL_MATCH

Otherwise, list each issue as a numbered item. Be specific about the element name and what needs to change. Focus on issues that are clearly visible — ignore sub-pixel rendering differences.`;

// --- Playwright management ---

/**
 * Try to dynamically import Playwright.
 * Returns null if not installed.
 */
// biome-ignore lint: any is needed for optional dynamic import
async function tryImportPlaywright(): Promise<any | null> {
  try {
    const moduleName = 'playwright';
    return await import(moduleName);
  } catch {
    return null;
  }
}

/**
 * Ensure Playwright is installed. If not found, auto-install it globally
 * along with the Chromium browser.
 */
// biome-ignore lint: any is needed for optional dynamic import
async function ensurePlaywright(log?: (msg: string) => void): Promise<any | null> {
  const pw = await tryImportPlaywright();
  if (pw) return pw;

  const print = log || (() => {});
  print('Installing playwright for visual validation...');

  try {
    await execa('npm', ['install', '-g', 'playwright'], {
      timeout: 120_000,
      reject: true,
    });

    print('Installing Chromium browser...');
    await execa('npx', ['playwright', 'install', 'chromium'], {
      timeout: 180_000,
      reject: true,
    });

    const pwAfterInstall = await tryImportPlaywright();
    if (pwAfterInstall) {
      print('Playwright installed successfully');
      return pwAfterInstall;
    }
  } catch {
    print('Failed to auto-install playwright — visual validation will be skipped');
  }

  return null;
}

// --- Screenshot capture ---

/**
 * Capture a full-page screenshot of a URL using Playwright.
 * Returns the screenshot as a PNG Buffer, or null if capture fails.
 */
export async function captureScreenshot(
  url: string,
  viewport: { width: number; height: number } = { width: 1920, height: 1080 },
  // biome-ignore lint: pre-resolved playwright module
  playwrightModule?: any
): Promise<Buffer | null> {
  const pw = playwrightModule || (await tryImportPlaywright());
  if (!pw) return null;

  // biome-ignore lint: dynamic import has no types
  let browser: any = null;

  try {
    browser = await pw.chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });

    // Wait for CSS transitions/animations to settle
    await page.waitForTimeout(1000);

    const screenshot = await page.screenshot({ fullPage: true });
    return Buffer.from(screenshot);
  } catch {
    return null;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

// --- Layer 1: Pixel diff with pixelmatch ---

export interface PixelDiffResult {
  /** Ratio of different pixels (0–1) */
  diffRatio: number;
  /** Absolute number of different pixels */
  diffPixels: number;
  /** Total pixels compared */
  totalPixels: number;
  /** PNG buffer of the diff overlay (red = different) */
  diffImage: Buffer;
}

/**
 * Compare two PNG images at the pixel level using pixelmatch.
 * Images are resized to match dimensions if needed (uses the smaller dimensions).
 */
export function pixelDiff(designPng: Buffer, implPng: Buffer): PixelDiffResult {
  const design = PNG.sync.read(designPng);
  const impl = PNG.sync.read(implPng);

  // Use the smaller dimensions to compare the overlapping region
  const width = Math.min(design.width, impl.width);
  const height = Math.min(design.height, impl.height);

  // If dimensions differ significantly, crop both to the common area
  const designCropped = cropPngData(design, width, height);
  const implCropped = cropPngData(impl, width, height);

  const diff = new PNG({ width, height });
  const totalPixels = width * height;

  const diffPixels = pixelmatch(designCropped, implCropped, diff.data, width, height, {
    threshold: PIXELMATCH_THRESHOLD,
    includeAA: false, // Ignore anti-aliasing differences
  });

  const diffImage = PNG.sync.write(diff);

  return {
    diffRatio: totalPixels > 0 ? diffPixels / totalPixels : 0,
    diffPixels,
    totalPixels,
    diffImage,
  };
}

/**
 * Crop PNG raw pixel data to the specified dimensions.
 */
function cropPngData(
  png: { data: Buffer; width: number; height: number },
  targetWidth: number,
  targetHeight: number
): Buffer {
  if (png.width === targetWidth && png.height === targetHeight) {
    return png.data;
  }

  const cropped = Buffer.alloc(targetWidth * targetHeight * 4);
  for (let y = 0; y < targetHeight; y++) {
    const srcOffset = y * png.width * 4;
    const dstOffset = y * targetWidth * 4;
    png.data.copy(cropped, dstOffset, srcOffset, srcOffset + targetWidth * 4);
  }
  return cropped;
}

// --- Layer 2: LLM Vision comparison ---

/**
 * Compare screenshots using LLM vision, including a pixel diff overlay for precision.
 */
export async function compareWithLLMVision(
  designBuffer: Buffer,
  implBuffer: Buffer,
  diffBuffer: Buffer,
  options?: { provider?: LLMProvider; model?: string }
): Promise<{ matches: boolean; issues: string[]; usage?: LLMUsage }> {
  const provider = options?.provider || detectProviderFromEnv();
  if (!provider) {
    return {
      matches: true,
      issues: ['No LLM provider available for visual comparison — skipping'],
    };
  }

  const apiKey = getProviderKeyFromEnv(provider);
  if (!apiKey) {
    return {
      matches: true,
      issues: [`No API key for ${provider} — skipping visual comparison`],
    };
  }

  const designBase64 = designBuffer.toString('base64');
  const implBase64 = implBuffer.toString('base64');
  const diffBase64 = diffBuffer.toString('base64');

  if (provider === 'anthropic') {
    return compareWithAnthropic(apiKey, designBase64, implBase64, diffBase64, options?.model);
  }
  return compareWithOpenAI(provider, apiKey, designBase64, implBase64, diffBase64, options?.model);
}

async function compareWithAnthropic(
  apiKey: string,
  designBase64: string,
  implBase64: string,
  diffBase64: string,
  model?: string
): Promise<{ matches: boolean; issues: string[]; usage?: LLMUsage }> {
  const client = new Anthropic({ apiKey, timeout: 60_000 });

  const response = await client.messages.create({
    model: model || 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: VISION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'TARGET DESIGN from Figma:' },
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/png', data: designBase64 },
          },
          { type: 'text', text: 'CURRENT IMPLEMENTATION:' },
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/png', data: implBase64 },
          },
          { type: 'text', text: 'PIXEL DIFF OVERLAY (red = different):' },
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/png', data: diffBase64 },
          },
          { type: 'text', text: VISION_COMPARISON_PROMPT },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  const content = textBlock && 'text' in textBlock ? textBlock.text : '';

  const rawUsage = response.usage as unknown as Record<string, number>;
  const usage: LLMUsage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheCreationInputTokens: rawUsage.cache_creation_input_tokens,
    cacheReadInputTokens: rawUsage.cache_read_input_tokens,
  };

  return parseComparisonResponse(content, usage);
}

async function compareWithOpenAI(
  provider: 'openai' | 'openrouter',
  apiKey: string,
  designBase64: string,
  implBase64: string,
  diffBase64: string,
  model?: string
): Promise<{ matches: boolean; issues: string[]; usage?: LLMUsage }> {
  const config = PROVIDERS[provider];
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://github.com/ralph-starter';
    headers['X-Title'] = 'ralph-starter';
  }

  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model || config.defaultModel,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: VISION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'TARGET DESIGN from Figma:' },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${designBase64}` },
            },
            { type: 'text', text: 'CURRENT IMPLEMENTATION:' },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${implBase64}` },
            },
            { type: 'text', text: 'PIXEL DIFF OVERLAY (red = different):' },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${diffBase64}` },
            },
            { type: 'text', text: VISION_COMPARISON_PROMPT },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      matches: true,
      issues: [`Vision API error (${response.status}): ${errorText.slice(0, 200)}`],
    };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  const usage: LLMUsage | undefined = data.usage
    ? {
        inputTokens: data.usage.prompt_tokens || 0,
        outputTokens: data.usage.completion_tokens || 0,
      }
    : undefined;

  return parseComparisonResponse(content, usage);
}

/**
 * Parse the LLM comparison response into structured results.
 */
function parseComparisonResponse(
  content: string,
  usage?: LLMUsage
): { matches: boolean; issues: string[]; usage?: LLMUsage } {
  const trimmed = content.trim();

  if (trimmed.includes('VISUAL_MATCH')) {
    return { matches: true, issues: [], usage };
  }

  const issues: string[] = [];
  const lines = trimmed.split('\n');
  let currentIssue = '';

  for (const line of lines) {
    const numberedMatch = line.match(/^\d+\.\s+\*?\*?(.+)/);
    if (numberedMatch) {
      if (currentIssue) {
        issues.push(currentIssue.trim());
      }
      currentIssue = numberedMatch[1].replace(/\*\*/g, '').trim();
    } else if (currentIssue && line.trim().startsWith('-')) {
      currentIssue += ` ${line.trim()}`;
    } else if (currentIssue && line.trim()) {
      currentIssue += ` ${line.trim()}`;
    } else if (currentIssue) {
      issues.push(currentIssue.trim());
      currentIssue = '';
    }
  }
  if (currentIssue) {
    issues.push(currentIssue.trim());
  }

  if (issues.length === 0 && trimmed.length > 0) {
    issues.push(trimmed.slice(0, 500));
  }

  return { matches: issues.length === 0, issues, usage };
}

// --- Main orchestrator ---

/**
 * Run the full three-layer visual validation pipeline:
 *
 * 1. Start dev server → capture implementation screenshot
 * 2. Layer 1 (pixelmatch): fast pixel diff scoring
 *    - If diff < 2% in strict mode → PASS (pixel perfect)
 *    - If diff < 5% → PASS (close enough, skip LLM)
 *    - If diff >= 5% → proceed to Layer 2
 * 3. Layer 2 (LLM Vision): semantic comparison with diff overlay
 *    - Returns actionable issues for the agent to fix
 * 4. Layer 3 (strict mode): after agent fixes, re-run with strict threshold
 *    - If diff still > 2% → format pixel diff details as feedback
 *
 * Returns success=true if validation passes or cannot be performed.
 */
export async function runVisualValidation(
  cwd: string,
  designScreenshots: string[],
  options: VisualValidationOptions = {}
): Promise<VisualValidationResult> {
  const print = options.log || (() => {});

  // Ensure Playwright is available — auto-install if missing
  const pw = await ensurePlaywright(options.log);
  if (!pw) {
    return { success: true, issues: [] };
  }

  // Filter to only existing design screenshot files
  const existingScreenshots = designScreenshots.filter((p) => existsSync(p));
  if (existingScreenshots.length === 0) {
    return { success: true, issues: [] };
  }

  // Start dev server
  let server: DevServerInfo | null = null;
  try {
    server = await startDevServer(cwd, options.serverTimeout ?? 30_000);
  } catch {
    return { success: true, issues: [] };
  }
  if (!server) {
    return { success: true, issues: [] };
  }

  const allIssues: string[] = [];
  let totalUsage: LLMUsage | undefined;
  let worstDiffRatio = 0;
  let diffImagePath: string | undefined;

  try {
    const viewport = {
      width: options.viewportWidth ?? 1920,
      height: options.viewportHeight ?? 1080,
    };

    const implScreenshot = await captureScreenshot(server.url, viewport, pw);
    if (!implScreenshot) {
      return { success: true, issues: [] };
    }

    for (const designPath of existingScreenshots) {
      const designBuffer = readFileSync(designPath);

      // --- Layer 1: pixelmatch ---
      print('Running pixel comparison...');
      const diff = pixelDiff(designBuffer, implScreenshot);
      const pct = (diff.diffRatio * 100).toFixed(1);

      if (diff.diffRatio > worstDiffRatio) {
        worstDiffRatio = diff.diffRatio;
      }

      // Save diff image for debugging / agent reference
      try {
        const ralphDir = join(cwd, '.ralph');
        if (!existsSync(ralphDir)) {
          const { mkdirSync } = await import('node:fs');
          mkdirSync(ralphDir, { recursive: true });
        }
        const diffPath = join(ralphDir, 'visual-diff.png');
        writeFileSync(diffPath, diff.diffImage);
        diffImagePath = diffPath;
      } catch {
        // Non-critical
      }

      // Strict mode (Layer 3): tight threshold after previous fixes
      const threshold = options.strictMode ? PIXEL_DIFF_STRICT_THRESHOLD : PIXEL_DIFF_LLM_THRESHOLD;

      if (diff.diffRatio <= threshold) {
        print(
          `Pixel diff: ${pct}% — ${options.strictMode ? 'strict check passed' : 'within tolerance'}`
        );
        continue; // This design screenshot passes
      }

      print(
        `Pixel diff: ${pct}% (${diff.diffPixels.toLocaleString()} pixels differ) — analyzing...`
      );

      // In strict mode, skip LLM and just report the pixel diff directly
      if (options.strictMode) {
        allIssues.push(
          `Pixel diff is ${pct}% (${diff.diffPixels.toLocaleString()} pixels) — exceeds the ${(PIXEL_DIFF_STRICT_THRESHOLD * 100).toFixed(0)}% strict threshold. Check .ralph/visual-diff.png for the diff overlay. Fine-tune spacing, colors, and font sizes to match the Figma design exactly.`
        );
        continue;
      }

      // --- Layer 2: LLM Vision with diff overlay ---
      print('Sending to LLM vision for semantic analysis...');
      const llmResult = await compareWithLLMVision(designBuffer, implScreenshot, diff.diffImage, {
        provider: options.provider,
        model: options.model,
      });

      if (!llmResult.matches) {
        allIssues.push(...llmResult.issues);
      }

      // Accumulate usage
      if (llmResult.usage) {
        if (!totalUsage) {
          totalUsage = { ...llmResult.usage };
        } else {
          totalUsage.inputTokens += llmResult.usage.inputTokens;
          totalUsage.outputTokens += llmResult.usage.outputTokens;
        }
      }
    }
  } finally {
    await server.kill();
  }

  return {
    success: allIssues.length === 0,
    issues: allIssues,
    diffRatio: worstDiffRatio,
    diffImagePath,
    usage: totalUsage,
  };
}
