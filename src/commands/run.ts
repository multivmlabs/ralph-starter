import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import chalk from 'chalk';
import { execa } from 'execa';
import inquirer from 'inquirer';
import ora from 'ora';
import { type IssueRef, initGitRepo, isGitRepo } from '../automation/git.js';
import type { SectionSummary } from '../integrations/figma/parsers/plan-generator.js';
import {
  type Agent,
  detectAvailableAgents,
  detectBestAgent,
  printAgentStatus,
} from '../loop/agents.js';
import { formatCost, formatTokens } from '../loop/cost-tracker.js';
import { type LoopOptions, runLoop } from '../loop/executor.js';
import { formatPrdPrompt, getPrdStats, parsePrdFile } from '../loop/prd-parser.js';
import { calculateOptimalIterations } from '../loop/task-counter.js';
import { formatPresetsHelp, getPreset, type PresetConfig } from '../presets/index.js';
import { autoInstallSkillsFromTask } from '../skills/auto-install.js';
import { getSourceDefaults } from '../sources/config.js';
import { fetchFromSource } from '../sources/index.js';
import type { SourceOptions } from '../sources/types.js';
import { detectPackageManager, formatRunCommand, getRunCommand } from '../utils/package-manager.js';
import {
  isValidFigmaCdnUrl,
  isValidPngBuffer,
  sanitizeAssetFilename,
  sanitizeSvgContent,
} from '../utils/sanitize.js';
import { showWelcome } from '../wizard/ui.js';

/** Default fallback repo for GitHub issues when no project is specified */
const DEFAULT_GITHUB_ISSUES_REPO = 'multivmlabs/ralph-ideas';

function formatDurationSeconds(durationSec: number): string {
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  return `${minutes}m ${seconds}s`;
}

/**
 * Detect how to run the project based on package.json scripts or common patterns
 */
function detectRunCommand(
  cwd: string
): { command: string; args: string[]; description: string } | null {
  // Check package.json for scripts
  const packageJsonPath = join(cwd, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const scripts = pkg.scripts || {};
      const pm = detectPackageManager(cwd);

      // Priority order for dev commands
      for (const script of ['dev', 'start', 'serve', 'preview']) {
        if (scripts[script]) {
          const cmd = getRunCommand(pm, script);
          return { ...cmd, description: formatRunCommand(pm, script) };
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Check for Python projects
  if (existsSync(join(cwd, 'main.py'))) {
    return { command: 'python', args: ['main.py'], description: 'python main.py' };
  }
  if (existsSync(join(cwd, 'app.py'))) {
    return { command: 'python', args: ['app.py'], description: 'python app.py' };
  }

  // Check for Go projects
  if (existsSync(join(cwd, 'main.go'))) {
    return { command: 'go', args: ['run', 'main.go'], description: 'go run main.go' };
  }

  return null;
}

/**
 * Detect the project's tech stack from package.json dependencies.
 * Returns a concise description like "React + TypeScript + Tailwind CSS v4".
 */
function detectProjectStack(cwd: string): string | null {
  const packageJsonPath = join(cwd, 'package.json');
  if (!existsSync(packageJsonPath)) return null;

  try {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    } as Record<string, string>;

    const parts: string[] = [];

    // Framework detection (pick one)
    if (allDeps.next) parts.push('Next.js');
    else if (allDeps.nuxt) parts.push('Nuxt');
    else if (allDeps['@remix-run/react'] || allDeps.remix) parts.push('Remix');
    else if (allDeps.astro) parts.push('Astro');
    else if (allDeps.svelte || allDeps['@sveltejs/kit']) parts.push('Svelte');
    else if (allDeps.vue) parts.push('Vue');
    else if (allDeps.react) parts.push('React');

    // Language
    if (allDeps.typescript || existsSync(join(cwd, 'tsconfig.json'))) {
      parts.push('TypeScript');
    }

    // CSS framework
    if (allDeps.tailwindcss) {
      const version = allDeps.tailwindcss?.replace(/[\^~>=<]/g, '');
      const major = version ? Number.parseInt(version.split('.')[0], 10) : null;
      parts.push(major && major >= 4 ? 'Tailwind CSS v4' : 'Tailwind CSS');
    } else if (allDeps['styled-components']) {
      parts.push('styled-components');
    } else if (allDeps['@emotion/react']) {
      parts.push('Emotion');
    }

    return parts.length > 0 ? parts.join(' + ') : null;
  } catch {
    return null;
  }
}

/**
 * Extract tasks from spec content and format as implementation plan
 * Handles "### Task N:" headers with subtasks underneath
 * Ignores code blocks and example sections
 */
function extractTasksFromSpec(specContent: string): string | null {
  const lines = specContent.split('\n');
  const planLines: string[] = [];
  let currentTaskNum = 0;
  let inTaskSection = false;
  let inCodeBlock = false;
  let inExampleSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track code blocks (skip content inside ```)
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Track example sections (skip tasks inside examples)
    // But don't skip task headers that contain "format" or "example"
    const isTaskHeader = line.match(/^#{2,3}\s*Task\s*\d+/i);
    if (
      !isTaskHeader &&
      (line.match(/^#{1,3}\s+.*example/i) || line.match(/^#{1,2}\s+.*format\s*$/i))
    ) {
      inExampleSection = true;
      inTaskSection = false;
      continue;
    }

    // Exit example section on new main header (## Tasks, ## Overview, etc.)
    if (line.match(/^#{1,2}\s+[A-Z]/) && !line.toLowerCase().includes('example')) {
      inExampleSection = false;
    }

    // Skip if in example section
    if (inExampleSection) continue;

    // Match "### Task N: Description" or "## Task N: Description"
    const taskHeaderMatch = line.match(/^#{2,3}\s*Task\s*(\d+)[:\s]+(.+)/i);
    if (taskHeaderMatch) {
      currentTaskNum++;
      const taskName = taskHeaderMatch[2].trim();
      planLines.push(`\n### Task ${currentTaskNum}: ${taskName}`);
      planLines.push('');
      inTaskSection = true;
      continue;
    }

    // If we hit another major header, end the task section
    if (line.match(/^#{1,2}\s+[A-Z]/) && !line.toLowerCase().includes('task')) {
      inTaskSection = false;
    }

    // Collect checkboxes (subtasks) under the current task
    if (inTaskSection) {
      const checkboxMatch = line.match(/^(\s*)[-*]\s*\[([xX ])\]\s*(.+)/);
      if (checkboxMatch) {
        const indent = checkboxMatch[1] || '';
        const completed = checkboxMatch[2].toLowerCase() === 'x';
        const subtaskName = checkboxMatch[3].trim();
        const checkbox = completed ? '[x]' : '[ ]';
        planLines.push(`${indent}- ${checkbox} ${subtaskName}`);
      }
    }
  }

  // If no task headers found, fall back to just collecting top-level checkboxes
  if (currentTaskNum === 0) {
    inCodeBlock = false;
    inExampleSection = false;
    for (const line of lines) {
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;
      if (line.match(/^#{1,3}\s+.*example/i)) {
        inExampleSection = true;
        continue;
      }
      if (line.match(/^#{1,2}\s+[A-Z]/) && !line.toLowerCase().includes('example')) {
        inExampleSection = false;
      }
      if (inExampleSection) continue;

      // Only match non-indented checkboxes (top-level tasks)
      const taskMatch = line.match(/^[-*]\s*\[([xX ])\]\s*(.+)/);
      if (taskMatch) {
        const completed = taskMatch[1].toLowerCase() === 'x';
        const taskName = taskMatch[2].trim();
        const checkbox = completed ? '[x]' : '[ ]';
        planLines.push(`- ${checkbox} ${taskName}`);
      }
    }
  }

  if (planLines.length === 0) {
    return null;
  }

  // Create implementation plan content
  const planContent = `# Implementation Plan

*Auto-generated from spec*

## Tasks
${planLines.join('\n')}
`;

  return planContent;
}

export interface RunCommandOptions {
  auto?: boolean;
  commit?: boolean;
  push?: boolean;
  pr?: boolean;
  validate?: boolean;
  docker?: boolean;
  prd?: string;
  maxIterations?: number;
  agent?: string;
  model?: string;
  // Source options
  from?: string;
  project?: string;
  label?: string;
  status?: string;
  limit?: number;
  issue?: number;
  outputDir?: string;
  // New options
  preset?: string;
  completionPromise?: string;
  requireExitSignal?: boolean;
  rateLimit?: number;
  trackProgress?: boolean;
  trackCost?: boolean;
  circuitBreakerFailures?: number;
  circuitBreakerErrors?: number;
  contextBudget?: number;
  validationWarmup?: number;
  maxCost?: number;
  plan?: string;
  // Figma options
  figmaMode?: 'spec' | 'tokens' | 'components' | 'assets' | 'content';
  figmaFramework?: 'react' | 'vue' | 'svelte' | 'astro' | 'nextjs' | 'nuxt' | 'html';
  figmaFormat?: 'css' | 'scss' | 'json' | 'tailwind';
  figmaNodes?: string;
  figmaScale?: number;
  figmaTarget?: string;
  figmaPreview?: boolean;
  figmaMapping?: string;
  // Design reference
  designImage?: string;
  // Visual comparison
  visualCheck?: boolean;
}

export async function runCommand(
  task: string | undefined,
  options: RunCommandOptions
): Promise<void> {
  let cwd = process.cwd();
  const spinner = ora();

  // Handle --output-dir flag
  if (options.outputDir) {
    const expandedPath = options.outputDir.replace(/^~/, homedir());
    cwd = resolve(expandedPath);
    mkdirSync(cwd, { recursive: true });
  }

  showWelcome();

  // Check for git repo
  if (options.commit || options.push || options.pr) {
    const isRepo = await isGitRepo(cwd);
    if (!isRepo) {
      const { initGit } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'initGit',
          message: 'Git repo not found. Initialize one?',
          default: true,
        },
      ]);

      if (initGit) {
        await initGitRepo(cwd);
        console.log(chalk.green('Git repository initialized'));
      } else {
        console.log(chalk.yellow('Git automation disabled (no repo)'));
        options.commit = false;
        options.push = false;
        options.pr = false;
      }
    }
  }

  // Handle --from source
  let sourceSpec: string | null = null;
  let sourceTitle: string | undefined;
  let sourceIssueRef: IssueRef | undefined;
  let figmaImagesDownloaded: boolean | undefined;
  let figmaFontSubstitutions: Array<{ original: string; substitute: string }> | undefined;
  let figmaSectionSummaries: SectionSummary[] | undefined;
  let figmaHasDesignTokens: boolean | undefined;
  let figmaIconFilenames: string[] | undefined;
  let figmaFontNames: string[] | undefined;
  if (options.from) {
    spinner.start('Fetching spec from source...');
    try {
      // Default to configured repo when using --issue without --project for GitHub
      let projectId = options.project || '';
      if (options.from.toLowerCase() === 'github' && options.issue && !options.project) {
        const githubDefaults = getSourceDefaults('github');
        projectId = githubDefaults?.defaultIssuesRepo || DEFAULT_GITHUB_ISSUES_REPO;
        console.log(chalk.dim(`  Using default repo: ${projectId}`));
      }

      const fetchOptions: SourceOptions = {
        label: options.label,
        status: options.status,
        limit: options.limit,
        issue: options.issue,
        figmaMode: options.figmaMode,
        figmaFramework: options.figmaFramework,
        figmaFormat: options.figmaFormat,
        figmaNodes: options.figmaNodes,
        figmaScale: options.figmaScale,
        figmaTarget: options.figmaTarget,
        figmaPreview: options.figmaPreview,
        figmaMapping: options.figmaMapping,
      };

      const result = await fetchFromSource(options.from, projectId, fetchOptions);

      spinner.succeed(`Fetched spec from ${result.source}`);
      sourceSpec = result.content;
      sourceTitle = result.title;

      // Auto-inject design tokens and content structure from pre-extracted metadata
      // (no additional API calls — extracted during the spec fetch)
      if (
        options.from.toLowerCase() === 'figma' &&
        (!options.figmaMode || options.figmaMode === 'spec')
      ) {
        const tokensContent = result.metadata?.tokensContent as string | undefined;
        if (tokensContent) {
          sourceSpec = `## Design Tokens\n\n${tokensContent}\n\n---\n\n${sourceSpec}`;
          console.log(chalk.dim('  Auto-injected design tokens into spec'));
        }

        const contentStructure = result.metadata?.contentStructure as string | undefined;
        if (contentStructure) {
          const contentSection = `## Content Structure\n\n${contentStructure}`;
          sourceSpec = `${contentSection}\n\n---\n\n${sourceSpec}`;
          console.log(chalk.dim('  Auto-injected content structure into spec'));
        }

        // Font substitution warnings
        const fontChecks = result.metadata?.fontChecks as
          | Array<{ fontFamily: string; isGoogleFont: boolean; suggestedAlternative?: string }>
          | undefined;
        if (fontChecks) {
          const nonGoogleFonts = fontChecks.filter((f) => !f.isGoogleFont);
          if (nonGoogleFonts.length > 0) {
            for (const font of nonGoogleFonts) {
              if (font.suggestedAlternative) {
                console.log(
                  chalk.yellow(
                    `  Font "${font.fontFamily}" \u2192 Google Fonts alternative "${font.suggestedAlternative}" \u2014 verify design fidelity`
                  )
                );
              } else {
                console.log(
                  chalk.yellow(
                    `  Font "${font.fontFamily}" is not available on Google Fonts \u2014 agent will choose a similar font`
                  )
                );
              }
            }
            // Inject font substitution table into spec
            const { buildFontSubstitutionMarkdown } = await import(
              '../integrations/figma/parsers/font-checker.js'
            );
            const fontSection = buildFontSubstitutionMarkdown(nonGoogleFonts);
            if (fontSection) {
              sourceSpec = `${fontSection}\n---\n\n${sourceSpec}`;
            }
            // Build substitutions array for loop options
            figmaFontSubstitutions = nonGoogleFonts
              .filter((f) => f.suggestedAlternative)
              .map((f) => ({
                original: f.fontFamily,
                substitute: f.suggestedAlternative!,
              }));
          }
        }

        // Auto-download images from Figma
        const imageFillUrls = result.metadata?.imageFillUrls as Record<string, string> | undefined;
        if (imageFillUrls && Object.keys(imageFillUrls).length > 0) {
          try {
            const imagesDir = join(cwd, 'public', 'images');
            mkdirSync(imagesDir, { recursive: true });

            const downloads = Object.entries(imageFillUrls).filter(
              ([, url]) => url != null && url !== ''
            );
            if (downloads.length > 0) {
              const BATCH_SIZE = 5;
              let downloaded = 0;
              for (let idx = 0; idx < downloads.length; idx += BATCH_SIZE) {
                const batch = downloads.slice(idx, idx + BATCH_SIZE);
                const results = await Promise.allSettled(
                  batch.map(async ([ref, url]) => {
                    if (!isValidFigmaCdnUrl(url)) return false;
                    const response = await fetch(url);
                    if (!response.ok) return false;
                    const buffer = Buffer.from(await response.arrayBuffer());
                    if (!isValidPngBuffer(buffer)) return false;
                    writeFileSync(join(imagesDir, `${sanitizeAssetFilename(ref)}.png`), buffer);
                    return true;
                  })
                );
                downloaded += results.filter((r) => r.status === 'fulfilled' && r.value).length;
              }

              if (downloaded > 0) {
                console.log(chalk.dim(`  Downloaded ${downloaded} image(s) to public/images/`));
                figmaImagesDownloaded = true;
              }
            }
          } catch {
            console.log(chalk.dim('  Image download skipped \u2014 will use placehold.co'));
          }
        }

        // Download frame screenshots for multimodal visual reference (with 30s timeout)
        const frameScreenshots = result.metadata?.frameScreenshots as
          | Record<string, string | null>
          | undefined;
        if (frameScreenshots) {
          const validScreenshots = Object.entries(frameScreenshots).filter(
            ([, url]) => url != null && url !== ''
          );
          if (validScreenshots.length > 0) {
            try {
              const screenshotsDir = join(cwd, 'public', 'images', 'screenshots');
              mkdirSync(screenshotsDir, { recursive: true });
              let ssDownloaded = 0;
              const ssTimeout = AbortSignal.timeout(30_000);
              const ssResults = await Promise.allSettled(
                validScreenshots.map(async ([nodeId, url]) => {
                  if (!isValidFigmaCdnUrl(url!)) return false;
                  const response = await fetch(url!, { signal: ssTimeout });
                  if (!response.ok) return false;
                  const buffer = Buffer.from(await response.arrayBuffer());
                  if (!isValidPngBuffer(buffer)) return false;
                  const filename = `frame-${sanitizeAssetFilename(nodeId.replace(/:/g, '-'))}.png`;
                  writeFileSync(join(screenshotsDir, filename), buffer);
                  return true;
                })
              );
              ssDownloaded = ssResults.filter((r) => r.status === 'fulfilled' && r.value).length;
              if (ssDownloaded > 0) {
                console.log(
                  chalk.dim(
                    `  Downloaded ${ssDownloaded} frame screenshot(s) to public/images/screenshots/`
                  )
                );
              }
            } catch {
              // Screenshot download failed — non-critical
            }
          }
        }

        // Download icon SVGs from Figma
        const iconSvgUrls = result.metadata?.iconSvgUrls as Record<string, string> | undefined;
        if (iconSvgUrls && Object.keys(iconSvgUrls).length > 0) {
          try {
            const iconNodes = result.metadata?.iconNodes as
              | Array<{ nodeId: string; filename: string }>
              | undefined;
            if (iconNodes) {
              const iconsDir = join(cwd, 'public', 'images', 'icons');
              mkdirSync(iconsDir, { recursive: true });
              let iconDownloaded = 0;
              const iconTimeout = AbortSignal.timeout(30_000);
              const iconResults = await Promise.allSettled(
                iconNodes.map(async (icon) => {
                  const url = iconSvgUrls[icon.nodeId];
                  if (!url || !isValidFigmaCdnUrl(url)) return false;
                  const response = await fetch(url, { signal: iconTimeout });
                  if (!response.ok) return false;
                  const svg = sanitizeSvgContent(await response.text());
                  writeFileSync(join(iconsDir, sanitizeAssetFilename(icon.filename)), svg);
                  return true;
                })
              );
              iconDownloaded = iconResults.filter(
                (r) => r.status === 'fulfilled' && r.value
              ).length;
              if (iconDownloaded > 0) {
                console.log(
                  chalk.dim(`  Downloaded ${iconDownloaded} icon(s) as SVG to public/images/icons/`)
                );
              }
            }
          } catch {
            // Icon download failed — non-critical
          }
        }

        // Download composite visual group renders (overlapping layers combined into one image)
        const compositeRenderUrls = result.metadata?.compositeRenderUrls as
          | Record<string, string | null>
          | undefined;
        const compositeNodes = result.metadata?.compositeNodes as
          | Array<{ nodeId: string; name: string }>
          | undefined;
        if (compositeRenderUrls && compositeNodes) {
          try {
            const imagesDir = join(cwd, 'public', 'images');
            mkdirSync(imagesDir, { recursive: true });
            let compositeDownloaded = 0;
            const compTimeout = AbortSignal.timeout(30_000);
            const compResults = await Promise.allSettled(
              compositeNodes.map(async (comp) => {
                const url = compositeRenderUrls[comp.nodeId];
                if (!url || !isValidFigmaCdnUrl(url)) return false;
                const response = await fetch(url, { signal: compTimeout });
                if (!response.ok) return false;
                const buffer = Buffer.from(await response.arrayBuffer());
                if (!isValidPngBuffer(buffer)) return false;
                const safeName = sanitizeAssetFilename(comp.name);
                writeFileSync(join(imagesDir, `composite-${safeName}.png`), buffer);
                return true;
              })
            );
            compositeDownloaded = compResults.filter(
              (r) => r.status === 'fulfilled' && r.value
            ).length;
            if (compositeDownloaded > 0) {
              console.log(
                chalk.dim(
                  `  Downloaded ${compositeDownloaded} composite background(s) to public/images/`
                )
              );
            }
          } catch {
            // Composite download failed — non-critical, falls back to individual layers
          }
        }
        // Optimize downloaded images (compress/resize to max 1MB)
        if (figmaImagesDownloaded) {
          try {
            const { readdirSync } = await import('node:fs');
            const { optimizeImage } = await import('../utils/image-optimizer.js');
            const allImageFiles: string[] = [];

            // Collect image files from public/images/ (not subdirectories)
            const imagesDir = join(cwd, 'public', 'images');
            if (existsSync(imagesDir)) {
              for (const file of readdirSync(imagesDir)) {
                if (file.endsWith('.png')) {
                  allImageFiles.push(join(imagesDir, file));
                }
              }
            }
            // Collect screenshot files
            const screenshotsDir = join(cwd, 'public', 'images', 'screenshots');
            if (existsSync(screenshotsDir)) {
              for (const file of readdirSync(screenshotsDir)) {
                if (file.endsWith('.png')) {
                  allImageFiles.push(join(screenshotsDir, file));
                }
              }
            }

            if (allImageFiles.length > 0) {
              let totalSaved = 0;
              let optimizedCount = 0;
              for (const filePath of allImageFiles) {
                const result = await optimizeImage(filePath);
                if (result.optimized) {
                  totalSaved += result.originalSize - result.newSize;
                  optimizedCount++;
                }
              }
              if (totalSaved > 0) {
                console.log(
                  chalk.dim(
                    `  Optimized ${optimizedCount} image(s): saved ${(totalSaved / 1024 / 1024).toFixed(1)}MB`
                  )
                );
              }
            }
          } catch {
            // Image optimization failed — non-critical, keep originals
          }
        }

        // Capture metadata for plan generation (used after try/catch scope)
        figmaSectionSummaries = result.metadata?.sectionSummaries as SectionSummary[] | undefined;
        figmaHasDesignTokens = !!result.metadata?.tokensContent;
        const iconNodesForPlan = result.metadata?.iconNodes as
          | Array<{ nodeId: string; filename: string }>
          | undefined;
        figmaIconFilenames = iconNodesForPlan?.map((n) => n.filename);
        // Collect unique font names from font checks
        const allFontChecks = result.metadata?.fontChecks as
          | Array<{ fontFamily: string; isGoogleFont: boolean; suggestedAlternative?: string }>
          | undefined;
        if (allFontChecks) {
          figmaFontNames = [
            ...new Set(
              allFontChecks.map((f) =>
                f.isGoogleFont ? f.fontFamily : (f.suggestedAlternative ?? f.fontFamily)
              )
            ),
          ];
        }
      }

      // Extract issue reference from metadata for PR linking
      if (
        result.metadata?.type === 'github' &&
        result.metadata.owner &&
        result.metadata.repo &&
        result.metadata.issue
      ) {
        sourceIssueRef = {
          owner: result.metadata.owner as string,
          repo: result.metadata.repo as string,
          number: result.metadata.issue as number,
        };
      }

      // Write to specs directory
      const specsDir = join(cwd, 'specs');
      mkdirSync(specsDir, { recursive: true });

      const specFilename = result.title
        ? `${result.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`
        : 'source-spec.md';
      const specPath = join(specsDir, specFilename);
      writeFileSync(specPath, sourceSpec);
      console.log(chalk.dim(`  Written to: ${specPath}`));

      // Cap spec size for agent context (full spec remains on disk in specs/)
      // Figma specs include richer visual data (fills, gradients, strokes) — allow more room
      const MAX_SPEC_SIZE = options.from?.toLowerCase() === 'figma' ? 25_000 : 15_000;
      if (sourceSpec.length > MAX_SPEC_SIZE) {
        console.log(
          chalk.yellow(
            `  Spec is large (${(sourceSpec.length / 1024).toFixed(1)}KB). Trimming to ${(MAX_SPEC_SIZE / 1024).toFixed(0)}KB for agent context.`
          )
        );
        const truncated = sourceSpec.slice(0, MAX_SPEC_SIZE);
        const lastSection = truncated.lastIndexOf('\n## ');
        sourceSpec =
          lastSection > MAX_SPEC_SIZE * 0.7
            ? `${truncated.slice(0, lastSection)}\n\n[Spec truncated — see specs/ directory for full design specification]`
            : `${truncated}\n\n[Spec truncated — see specs/ directory for full design specification]`;
      }

      // Prompt for project location when fetching from integration sources
      // Skip if --auto or --output-dir was provided
      const integrationSources = ['github', 'linear', 'notion', 'figma'];
      const isIntegrationSource = integrationSources.includes(options.from?.toLowerCase() || '');

      if (isIntegrationSource && !options.auto && !options.outputDir) {
        // Detect existing project markers to choose smart default ordering
        const projectMarkers = [
          'package.json',
          '.git',
          'Cargo.toml',
          'go.mod',
          'pyproject.toml',
          'requirements.txt',
          'Gemfile',
          'pom.xml',
          'build.gradle',
        ];
        const hasProjectMarkers = projectMarkers.some((f) => existsSync(join(cwd, f)));

        // If existing project detected, default to "Current directory" first
        const choices = hasProjectMarkers
          ? [
              { name: `Current directory (${cwd})`, value: 'current' },
              { name: 'Create new project folder', value: 'new' },
              { name: 'Enter custom path', value: 'custom' },
            ]
          : [
              { name: 'Create new project folder', value: 'new' },
              { name: `Current directory (${cwd})`, value: 'current' },
              { name: 'Enter custom path', value: 'custom' },
            ];

        const { projectLocation } = await inquirer.prompt([
          {
            type: 'select',
            name: 'projectLocation',
            message: 'Where do you want to run this task?',
            choices,
          },
        ]);

        if (projectLocation === 'new') {
          // Generate default name from spec title
          const defaultName =
            result.title
              ?.toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '')
              .slice(0, 50) || 'new-project';

          const { folderName } = await inquirer.prompt([
            {
              type: 'input',
              name: 'folderName',
              message: 'Project folder name:',
              default: defaultName,
            },
          ]);

          const newCwd = join(process.cwd(), folderName);
          mkdirSync(newCwd, { recursive: true });
          cwd = newCwd;
          console.log(chalk.dim(`  Created: ${cwd}`));
        } else if (projectLocation === 'custom') {
          const { customPath } = await inquirer.prompt([
            {
              type: 'input',
              name: 'customPath',
              message: 'Enter path:',
            },
          ]);

          // Expand ~ to home directory
          const expandedPath = customPath.replace(/^~/, homedir());
          cwd = resolve(expandedPath);
          mkdirSync(cwd, { recursive: true });
          console.log(chalk.dim(`  Using: ${cwd}`));
        }
        // 'current' - no change needed
      }
    } catch (error) {
      spinner.fail('Failed to fetch from source');
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  }

  // Detect agent - use explicit selection or auto-detect best
  let agent: Agent | null = null;

  if (options.agent) {
    // Explicit agent selection via --agent flag
    spinner.start('Checking agent...');
    const agents = await detectAvailableAgents();
    const found = agents.find(
      (a) => a.type === options.agent || a.name.toLowerCase() === options.agent?.toLowerCase()
    );
    spinner.stop();

    if (!found || !found.available) {
      console.log(chalk.red(`Agent "${options.agent}" not found or not available.`));
      printAgentStatus(agents);
      process.exit(1);
    }
    agent = found;
  } else {
    // Auto-detect best agent (same as plan.ts)
    spinner.start('Detecting coding agent...');
    agent = await detectBestAgent();
    spinner.stop();

    if (!agent) {
      console.log(chalk.red('No coding agents found!'));
      console.log();
      console.log(chalk.yellow('Please install one of these:'));
      console.log(chalk.gray('  Claude Code: npm install -g @anthropic-ai/claude-code'));
      console.log(chalk.gray('  Cursor:      https://cursor.sh'));
      console.log(chalk.gray('  Codex:       npm install -g codex'));
      console.log(chalk.gray('  OpenCode:    npm install -g opencode'));
      process.exit(1);
    }
  }

  console.log(chalk.dim(`Using agent: ${agent.name}`));

  // Check for Ralph Playbook files
  const buildPromptPath = join(cwd, 'PROMPT_build.md');
  const implementationPlanPath = join(cwd, 'IMPLEMENTATION_PLAN.md');
  const hasPlaybook = existsSync(buildPromptPath) && existsSync(implementationPlanPath);

  // Get task if not provided
  let finalTask = task;

  // If we fetched from a source, combine spec with task
  if (sourceSpec) {
    // Detect project tech stack for richer task context
    const projectStack = detectProjectStack(cwd);

    // Extract tasks from spec and create implementation plan
    // Figma sources get a detailed plan with concrete design values per section;
    // other sources use generic task extraction from spec headers/checkboxes.
    let extractedPlan: string | null = null;

    if (
      options.from?.toLowerCase() === 'figma' &&
      (!options.figmaMode || options.figmaMode === 'spec') &&
      figmaSectionSummaries &&
      figmaSectionSummaries.length > 0
    ) {
      const { extractFigmaPlan } = await import('../integrations/figma/parsers/plan-generator.js');
      extractedPlan = extractFigmaPlan(figmaSectionSummaries, {
        fileName: sourceTitle || 'Figma Design',
        projectStack,
        imagesDownloaded: figmaImagesDownloaded,
        hasDesignTokens: figmaHasDesignTokens,
        iconFilenames: figmaIconFilenames,
        fontNames: figmaFontNames,
      });
    }

    if (!extractedPlan) {
      extractedPlan = extractTasksFromSpec(sourceSpec);
    }

    if (extractedPlan) {
      writeFileSync(implementationPlanPath, extractedPlan);
      console.log(chalk.cyan('Created IMPLEMENTATION_PLAN.md from spec'));
    }
    const stackSection = projectStack
      ? `\n## Project Stack\n\nUse the existing project stack: **${projectStack}**. Follow existing patterns and conventions in the codebase.\n`
      : '';
    if (projectStack) {
      console.log(chalk.dim(`  Stack: ${projectStack}`));
    }

    // Build a concise task headline from source title and stack
    const taskHeadline = sourceTitle
      ? `Implement the "${sourceTitle}" design${projectStack ? ` with ${projectStack}` : ''}.`
      : `Implement this design${projectStack ? ` with ${projectStack}` : ''}.`;

    if (finalTask) {
      // User provided both a task and a source spec — combine them
      finalTask = `${taskHeadline}

Study the following specification carefully:

${sourceSpec}
${stackSection}
## User Instructions

${finalTask}

## Implementation Tracking

${
  extractedPlan
    ? `An IMPLEMENTATION_PLAN.md file has been created with tasks extracted from this spec.
As you complete each task, mark it done by changing [ ] to [x] in IMPLEMENTATION_PLAN.md.`
    : `Create an IMPLEMENTATION_PLAN.md file with tasks broken down from the spec above.
As you complete each task, mark it done by changing [ ] to [x] in IMPLEMENTATION_PLAN.md.`
}
Focus on ONE task at a time. Don't assume functionality is not already implemented — search the codebase first.
Implement completely — no placeholders or stubs.`;
    } else if (extractedPlan) {
      finalTask = `${taskHeadline}

Study the following specification carefully:

${sourceSpec}
${stackSection}
## Implementation Tracking

An IMPLEMENTATION_PLAN.md file has been created with tasks extracted from this spec.
As you complete each task, mark it done by changing [ ] to [x] in IMPLEMENTATION_PLAN.md.
Focus on ONE task at a time. Don't assume functionality is not already implemented — search the codebase first.
Implement completely — no placeholders or stubs.`;
    } else {
      finalTask = `${taskHeadline}

Study the following specification carefully:

${sourceSpec}
${stackSection}
## Getting Started

IMPORTANT: Before writing any code, you MUST first:
1. Study the specification above thoroughly
2. Search the codebase — don't assume functionality is not already implemented
3. Create an IMPLEMENTATION_PLAN.md file with tasks broken down as:

### Task 1: [name]
- [ ] Subtask a
- [ ] Subtask b

### Task 2: [name]
- [ ] Subtask a

Break the spec into 3-8 logical tasks, sorted by priority.

4. Then start working on Task 1 only.

As you complete each subtask, mark it done by changing [ ] to [x] in IMPLEMENTATION_PLAN.md.
Focus on ONE task at a time. Implement completely — no placeholders or stubs.`;
    }
    console.log(chalk.cyan('Using fetched specification as task'));
  }

  if (!finalTask && !options.prd) {
    // Check for Ralph Playbook build mode
    if (hasPlaybook) {
      console.log(chalk.cyan('Ralph Playbook detected'));
      console.log(chalk.dim('Using build mode from IMPLEMENTATION_PLAN.md'));
      console.log();

      // Read the build prompt and implementation plan
      const buildPrompt = readFileSync(buildPromptPath, 'utf-8');
      const implementationPlan = readFileSync(implementationPlanPath, 'utf-8');

      finalTask = `${buildPrompt}

## Current Implementation Plan

${implementationPlan}

Work through the tasks in the implementation plan. Mark tasks as complete as you finish them.
Focus on one task at a time. After completing a task, update IMPLEMENTATION_PLAN.md.`;
    } else {
      const { inputTask } = await inquirer.prompt([
        {
          type: 'input',
          name: 'inputTask',
          message: 'What would you like to build?',
          validate: (input: string) => (input.trim() ? true : 'Please enter a task'),
        },
      ]);
      finalTask = inputTask;
    }
  }

  // Handle PRD file
  if (options.prd) {
    const prd = parsePrdFile(options.prd);
    if (!prd) {
      console.log(chalk.red(`PRD file not found: ${options.prd}`));
      process.exit(1);
    }

    const stats = getPrdStats(prd);
    console.log(chalk.cyan(`PRD: ${prd.title}`));
    console.log(
      chalk.dim(
        `Tasks: ${stats.pending} pending, ${stats.completed} completed (${stats.percentComplete}% done)`
      )
    );
    console.log();

    if (stats.pending === 0) {
      console.log(chalk.green('All PRD tasks are complete!'));
      return;
    }

    finalTask = formatPrdPrompt(prd);
  }

  if (!finalTask) {
    console.log(chalk.red('No task provided.'));
    console.log(
      chalk.dim('Either provide a task or run `ralph-starter init` to set up Ralph Playbook.')
    );
    process.exit(1);
  }

  // Docker mode
  if (options.docker) {
    console.log(chalk.yellow('Docker sandbox mode coming soon!'));
    return;
  }

  // Auto-install relevant skills from skills.sh (enabled by default)
  await autoInstallSkillsFromTask(finalTask, cwd, options.from?.toLowerCase());

  // Copy design reference image to specs/ so the agent can read it
  let designImagePath: string | undefined;
  if (options.designImage) {
    const srcPath = resolve(options.designImage);
    if (!existsSync(srcPath)) {
      console.log(chalk.red(`Design image not found: ${srcPath}`));
      process.exit(1);
    }
    const specsDir = join(cwd, 'specs');
    mkdirSync(specsDir, { recursive: true });
    const destPath = join(specsDir, 'design-reference.png');
    copyFileSync(srcPath, destPath);
    designImagePath = 'specs/design-reference.png';
    console.log(chalk.cyan(`Design reference image: ${designImagePath}`));
  }

  // Apply preset if specified
  let preset: PresetConfig | undefined;
  if (options.preset) {
    preset = getPreset(options.preset);
    if (!preset) {
      console.log(chalk.red(`Unknown preset: ${options.preset}`));
      console.log();
      console.log(formatPresetsHelp());
      process.exit(1);
    }
    console.log(chalk.cyan(`Using preset: ${preset.name}`));
    console.log(chalk.dim(preset.description));
  }

  // Calculate smart iterations based on tasks (always, unless explicitly overridden)
  const {
    iterations: smartIterations,
    taskCount,
    reason,
  } = calculateOptimalIterations(cwd, finalTask);
  if (!options.maxIterations && !preset?.maxIterations) {
    if (taskCount.total > 0) {
      console.log(
        chalk.dim(`Tasks: ${taskCount.pending} pending, ${taskCount.completed} completed`)
      );
    }
    console.log(chalk.dim(`Max iterations: ${smartIterations} (${reason})`));
  }

  // Auto-detect greenfield builds: skip validation until enough tasks are done
  const isGreenfield = taskCount.total > 0 && taskCount.completed === 0;
  const autoWarmup = isGreenfield ? Math.max(2, Math.floor(taskCount.total * 0.5)) : 0;
  const validationWarmup = options.validationWarmup ? Number(options.validationWarmup) : autoWarmup;
  if (validationWarmup > 0 && options.validate) {
    console.log(
      chalk.dim(`Validation warm-up: skipping until ${validationWarmup} tasks completed`)
    );
  }

  // Collect Figma frame screenshot paths for visual comparison validation
  let figmaScreenshotPaths: string[] | undefined;
  let visualValidation = false;
  const screenshotsDir = join(cwd, 'public', 'images', 'screenshots');
  if (existsSync(screenshotsDir)) {
    try {
      const { readdirSync } = await import('node:fs');
      const screenshots = readdirSync(screenshotsDir)
        .filter((f: string) => f.endsWith('.png'))
        .map((f: string) => join(screenshotsDir, f));
      if (screenshots.length > 0) {
        figmaScreenshotPaths = screenshots;
        // Auto-enable when screenshots exist, unless explicitly disabled
        visualValidation = options.visualCheck !== false;
        if (visualValidation) {
          console.log(
            chalk.dim(`  Visual validation: ${screenshots.length} design screenshot(s) detected`)
          );
        }
      }
    } catch {
      // Non-critical — skip visual validation
    }
  }

  // Apply preset values with CLI overrides
  const loopOptions: LoopOptions = {
    task: preset?.promptPrefix ? `${preset.promptPrefix}\n\n${finalTask}` : finalTask,
    cwd,
    agent,
    maxIterations: options.maxIterations ?? preset?.maxIterations ?? smartIterations,
    auto: options.auto,
    commit: options.commit ?? preset?.commit,
    push: options.push,
    pr: options.pr,
    prTitle: undefined, // Let executor generate semantic title
    prIssueRef: sourceIssueRef,
    prLabels: options.auto ? ['AUTO'] : undefined,
    validate: options.validate ?? preset?.validate,
    validationWarmup,
    sourceType: options.from?.toLowerCase(),
    taskTitle: sourceTitle || (finalTask ? finalTask.slice(0, 80) : undefined),
    // New options
    completionPromise: options.completionPromise ?? preset?.completionPromise,
    requireExitSignal: options.requireExitSignal,
    rateLimit: options.rateLimit ?? preset?.rateLimit,
    trackProgress: options.trackProgress ?? true, // Default to true
    trackCost: options.trackCost ?? true, // Default to true
    model: options.model, // Pass through to agent CLI (e.g., --model claude-sonnet-4-5-20250929)
    checkFileCompletion: true, // Always check for file-based completion
    contextBudget: options.contextBudget ? Number(options.contextBudget) : undefined,
    maxCost: options.maxCost,
    planBudget: options.plan
      ? (await import('../loop/cost-tracker.js')).KNOWN_PLANS[options.plan.toLowerCase()]
      : undefined,
    circuitBreaker: preset?.circuitBreaker
      ? {
          maxConsecutiveFailures:
            options.circuitBreakerFailures ?? preset.circuitBreaker.maxConsecutiveFailures,
          maxSameErrorCount:
            options.circuitBreakerErrors ?? preset.circuitBreaker.maxSameErrorCount,
        }
      : options.circuitBreakerFailures || options.circuitBreakerErrors
        ? {
            maxConsecutiveFailures: options.circuitBreakerFailures ?? 3,
            maxSameErrorCount: options.circuitBreakerErrors ?? 5,
          }
        : undefined,
    figmaImagesDownloaded: figmaImagesDownloaded ?? undefined,
    figmaFontSubstitutions: figmaFontSubstitutions ?? undefined,
    designImagePath,
    visualValidation,
    figmaScreenshotPaths,
  };

  const result = await runLoop(loopOptions);

  // Print summary
  console.log();
  if (result.success) {
    console.log(chalk.green.bold('Loop completed!'));
    console.log(chalk.dim(`Exit reason: ${result.exitReason}`));
    console.log(chalk.dim(`Iterations: ${result.iterations}`));
    if (result.commits.length > 0) {
      console.log(chalk.dim(`Commits: ${result.commits.length}`));
    }
    if (result.stats) {
      const durationSec = Math.round(result.stats.totalDuration / 1000);
      console.log(chalk.dim(`Total duration: ${formatDurationSeconds(durationSec)}`));
      if (result.stats.validationFailures > 0) {
        console.log(chalk.dim(`Validation failures: ${result.stats.validationFailures}`));
      }
      if (result.stats.costStats) {
        const cost = result.stats.costStats;
        console.log(
          chalk.dim(
            `Total cost: ${formatCost(cost.totalCost.totalCost)} (${formatTokens(cost.totalTokens.totalTokens)} tokens)`
          )
        );
      }
    }

    // Offer to run the project
    const runCmd = detectRunCommand(cwd);
    if (runCmd) {
      console.log();
      const { shouldRun } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldRun',
          message: `Run the project with ${chalk.cyan(runCmd.description)}?`,
          default: true,
        },
      ]);

      if (shouldRun) {
        console.log();
        console.log(chalk.cyan(`Starting: ${runCmd.description}`));
        console.log(chalk.dim('Press Ctrl+C to stop'));
        console.log();

        try {
          // Run with stdio inherited so user can see output and interact
          await execa(runCmd.command, runCmd.args, {
            cwd,
            stdio: 'inherit',
          });
        } catch (error: unknown) {
          // User likely pressed Ctrl+C, which is expected
          if (
            error &&
            typeof error === 'object' &&
            'signal' in error &&
            error.signal === 'SIGINT'
          ) {
            console.log();
            console.log(chalk.dim('Stopped.'));
          } else {
            console.log(chalk.yellow('Process exited'));
          }
        }
      }
    }
  } else {
    // Check if it's a rate limit issue (already shown detailed message in executor)
    const isRateLimit = result.error?.includes('Rate limit');

    if (!isRateLimit) {
      // Only show generic failure for non-rate-limit errors
      console.log(chalk.red.bold('Loop failed'));
      console.log(chalk.dim(`Exit reason: ${result.exitReason}`));
      if (result.error) {
        console.log(chalk.dim(result.error));
      }
      if (result.stats?.circuitBreakerStats) {
        const cb = result.stats.circuitBreakerStats;
        console.log(
          chalk.dim(
            `Circuit breaker: ${cb.consecutiveFailures} consecutive failures, ${cb.uniqueErrors} unique errors`
          )
        );
      }
    }
    // Rate limit message was already shown in executor
  }
}
