/**
 * Figma Integration
 *
 * Fetches design specifications, tokens, components, and assets from Figma.
 *
 * Capabilities:
 * - spec: Fetch design specs as markdown for AI coding loops
 * - tokens: Extract design tokens (colors, typography, spacing)
 * - components: Generate component code (React, Vue, Svelte, HTML)
 * - assets: Export icons and images (SVG, PNG, PDF)
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  type AuthMethod,
  BaseIntegration,
  type IntegrationOptions,
  type IntegrationResult,
} from '../base.js';
import { figmaNodeToComponent, getFileExtension } from './parsers/component-code.js';
import { extractContent, formatContentAsMarkdown } from './parsers/content-extractor.js';
import {
  type CompositeNodeResult,
  collectCompositeNodes,
  nodesToSpec,
  selectPrimaryFrames,
} from './parsers/design-spec.js';
import { extractTokensFromFile, formatTokens } from './parsers/design-tokens.js';
import { checkFonts, collectFontFamilies } from './parsers/font-checker.js';
import { collectIconNodes } from './parsers/icon-collector.js';
import { collectImageRefs } from './parsers/image-collector.js';
import { extractSectionSummaries } from './parsers/plan-generator.js';
import type {
  FigmaFile,
  FigmaImageFillsResponse,
  FigmaImagesResponse,
  FigmaIntegrationOptions,
  FigmaNode,
  FigmaNodesResponse,
} from './types.js';
import { formatNodeIds, nodeIdToFilename, parseFigmaUrl } from './utils/url-parser.js';

export class FigmaIntegration extends BaseIntegration {
  name = 'figma';
  displayName = 'Figma';
  description = 'Fetch design specs, tokens, components, and assets from Figma';
  website = 'https://figma.com';

  authMethods: AuthMethod[] = ['api-key'];

  private readonly API_BASE = 'https://api.figma.com/v1';

  /**
   * Whether we detected a low-budget plan (starter/free with low limit-type).
   * When true, skip non-essential API calls (icons, screenshots) to conserve
   * the tiny request budget (6 req/month on starter-low).
   */
  private lowBudget = false;

  async fetch(
    identifier: string,
    options?: IntegrationOptions & FigmaIntegrationOptions
  ): Promise<IntegrationResult> {
    const { fileKey, nodeIds: urlNodeIds } = parseFigmaUrl(identifier);

    // Merge node IDs from URL and options
    let nodeIds = urlNodeIds || [];
    if (options?.nodeIds) {
      const optionNodeIds = options.nodeIds.split(',').map((id) => id.trim());
      nodeIds = [...new Set([...nodeIds, ...optionNodeIds])];
    }

    const mode = options?.mode || 'spec';

    switch (mode) {
      case 'spec':
        return this.fetchDesignSpec(fileKey, nodeIds);
      case 'tokens':
        return this.fetchDesignTokens(fileKey, options);
      case 'components':
        return this.fetchAndGenerateComponents(fileKey, nodeIds, options);
      case 'assets':
        return this.fetchAssets(fileKey, nodeIds, options);
      case 'content':
        return this.fetchContentExtraction(fileKey, nodeIds, options);
      default:
        return this.fetchDesignSpec(fileKey, nodeIds);
    }
  }

  /**
   * Fetch design specifications as markdown
   */
  private async fetchDesignSpec(fileKey: string, nodeIds: string[]): Promise<IntegrationResult> {
    const token = await this.getApiKey('token');

    let nodes: FigmaNode[];
    let fileName: string;
    let file: FigmaFile | null = null;

    // Filter out canvas/page-level node IDs (e.g., "0:1") — these don't narrow
    // the scope and prevent us from fetching the full file (needed for tokens).
    const specificNodeIds = nodeIds.filter((id) => !id.match(/^0:\d+$/));

    if (specificNodeIds.length > 0) {
      // Fetch specific nodes (user selected specific frames/components)
      const response = await this.apiRequest<FigmaNodesResponse>(
        token,
        `/files/${fileKey}/nodes?ids=${formatNodeIds(specificNodeIds)}`
      );
      fileName = response.name;
      nodes = Object.values(response.nodes).map((n) => n.document);
    } else {
      // Fetch entire file (reuse for tokens extraction below)
      file = await this.apiRequest<FigmaFile>(token, `/files/${fileKey}`);
      fileName = file.name;
      nodes = file.document.children || [];
    }

    // Check font availability
    const fontFamilies = collectFontFamilies(nodes);
    const fontChecks = checkFonts(fontFamilies);

    // Build font substitutions map for spec annotations
    const fontSubstitutions = new Map<string, string>();
    for (const check of fontChecks) {
      if (!check.isGoogleFont && check.suggestedAlternative) {
        fontSubstitutions.set(check.fontFamily, check.suggestedAlternative);
      }
    }

    // Collect image references from nodes
    const imageRefs = collectImageRefs(nodes);

    // Fetch image fill download URLs (important — enables image downloads)
    // This is the only additional API call beyond the file fetch — it's essential
    // for downloading design images. Icons and screenshots are best-effort.
    let imageFillUrls: Record<string, string> = {};
    if (imageRefs.length > 0) {
      try {
        imageFillUrls = await this.fetchImageFillUrls(fileKey, token);
      } catch {
        // Image fill URL fetch failed — proceed without images
      }
    }

    // Collect icon-like nodes for SVG export
    const iconNodes = collectIconNodes(nodes, 30);
    let iconSvgUrls: Record<string, string> = {};
    const exportedIcons = new Map<string, string>();
    let frameScreenshots: Record<string, string | null> = {};

    // Detect composite visual groups early — needed to deduplicate with frame screenshots.
    // Composites get a 2x render which is higher quality than the 1x frame screenshot,
    // so we prefer the composite and skip the duplicate screenshot.
    const compositeNodes: CompositeNodeResult[] = collectCompositeNodes(nodes);
    const compositeIdSet = new Set(compositeNodes.map((c) => c.nodeId));
    const compositeImages = new Map<string, string>();
    const compositeTextOverlays = new Set<string>();
    let compositeRenderUrls: Record<string, string | null> = {};

    // The /images endpoint has very strict rate limits (~10 req/min).
    // Icons + screenshots are best-effort: we combine all node IDs into
    // a single /images call to minimize API usage.
    // On low-budget plans (starter/free, 6 req/month), skip entirely to conserve budget.
    if (!this.lowBudget) {
      const topFrameIds = this.collectTopLevelFrameIds(nodes, 3);
      // Deduplicate: skip frame screenshots for nodes that are also composites
      const screenshotFrameIds = topFrameIds.filter((id) => !compositeIdSet.has(id));
      const iconIds = iconNodes.map((ic) => ic.nodeId);
      const allRenderIds = [...iconIds, ...screenshotFrameIds];

      if (allRenderIds.length > 0) {
        // Delay after image fills endpoint to avoid bursting
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Fetch icon SVGs (single request, non-essential — won't retry on 429)
        if (iconIds.length > 0) {
          try {
            const svgResponse = await this.apiRequest<FigmaImagesResponse>(
              token,
              `/images/${fileKey}?ids=${formatNodeIds(iconIds)}&format=svg`,
              false
            );
            if (!svgResponse.err && svgResponse.images) {
              iconSvgUrls = svgResponse.images as Record<string, string>;
              for (const icon of iconNodes) {
                if (iconSvgUrls[icon.nodeId]) {
                  exportedIcons.set(icon.nodeId, icon.filename);
                }
              }
            }
          } catch {
            // Icon SVG export failed (likely rate limited) — proceed without
          }
        }

        // Fetch frame screenshots (single request, non-essential — won't retry on 429)
        if (screenshotFrameIds.length > 0) {
          try {
            if (iconIds.length > 0) {
              await new Promise((resolve) => setTimeout(resolve, 1500));
            }
            const screenshotResponse = await this.apiRequest<FigmaImagesResponse>(
              token,
              `/images/${fileKey}?ids=${formatNodeIds(screenshotFrameIds)}&format=png&scale=2`,
              false
            );
            if (!screenshotResponse.err) {
              frameScreenshots = screenshotResponse.images;
            }
          } catch {
            // Screenshot rendering failed — non-critical, proceed without
          }
        }
      }

      // Fetch composite visual group renders (2x for higher quality)
      if (compositeNodes.length > 0) {
        const compositeIds = compositeNodes.map((c) => c.nodeId);
        try {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const compositeResponse = await this.apiRequest<FigmaImagesResponse>(
            token,
            `/images/${fileKey}?ids=${formatNodeIds(compositeIds)}&format=png&scale=2`,
            false // non-essential — won't retry on 429
          );
          if (!compositeResponse.err && compositeResponse.images) {
            compositeRenderUrls = compositeResponse.images;
            for (const comp of compositeNodes) {
              if (compositeRenderUrls[comp.nodeId]) {
                const safeName = comp.name
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/-+/g, '-');
                compositeImages.set(comp.nodeId, `/images/composite-${safeName}.png`);
                if (comp.hasTextOverlays) {
                  compositeTextOverlays.add(comp.nodeId);
                }
              }
            }
          }
        } catch {
          // Composite rendering failed — fall back to individual layer extraction
        }
      }
    }

    const specOptions = {
      fontSubstitutions,
      imageFillUrls,
      exportedIcons,
      compositeImages: compositeImages.size > 0 ? compositeImages : undefined,
      compositeTextOverlays: compositeTextOverlays.size > 0 ? compositeTextOverlays : undefined,
    };
    const content = nodesToSpec(nodes, fileName, specOptions);

    // Extract structured section summaries for plan generation
    const sectionSummaries = extractSectionSummaries(nodes, {
      imageFillUrls,
      compositeImages: compositeImages.size > 0 ? compositeImages : undefined,
      compositeTextOverlays: compositeTextOverlays.size > 0 ? compositeTextOverlays : undefined,
      exportedIcons: exportedIcons.size > 0 ? exportedIcons : undefined,
      fontSubstitutions: fontSubstitutions.size > 0 ? fontSubstitutions : undefined,
    });

    // Extract tokens from the file data we already have (avoids re-fetching)
    let tokensContent: string | undefined;
    if (file) {
      try {
        const tokens = extractTokensFromFile(file);
        const formatted = formatTokens(tokens, 'css');
        const totalCount = Object.values(tokens).reduce(
          (sum, group) => sum + Object.keys(group).length,
          0
        );
        if (totalCount > 0) {
          tokensContent = `# Design Tokens: ${fileName}\n\n\`\`\`css\n${formatted}\n\`\`\`\n`;
        }
      } catch {
        // Token extraction failed — non-critical
      }
    }

    // Extract content structure from nodes we already have (avoids re-fetching)
    let contentStructure: string | undefined;
    try {
      const extracted = extractContent(nodes, fileName);
      const contentMd = formatContentAsMarkdown(extracted);
      if (contentMd) {
        // Keep only navigation and IA summary (compact version)
        const contentLines = contentMd.split('\n');
        const summaryLines: string[] = [];
        let inSection = false;
        for (const line of contentLines) {
          if (
            line.startsWith('## Navigation') ||
            line.startsWith('## Summary') ||
            line.startsWith('## Information Architecture')
          ) {
            inSection = true;
            summaryLines.push(line);
          } else if (line.startsWith('## ') && inSection) {
            inSection = false;
          } else if (inSection) {
            summaryLines.push(line);
          }
        }
        if (summaryLines.length > 0) {
          contentStructure = summaryLines.join('\n');
        }
      }
    } catch {
      // Content extraction failed — non-critical
    }

    return {
      content,
      source: `figma:${fileKey}`,
      title: fileName,
      metadata: {
        type: 'figma',
        mode: 'spec',
        fileKey,
        nodeCount: nodes.length,
        fontChecks,
        imageRefs,
        imageFillUrls,
        imageCount: imageRefs.length,
        frameScreenshots,
        iconNodes,
        iconSvgUrls,
        tokensContent,
        contentStructure,
        compositeRenderUrls:
          Object.keys(compositeRenderUrls).length > 0 ? compositeRenderUrls : undefined,
        compositeNodes: compositeNodes.length > 0 ? compositeNodes : undefined,
        compositeImages: compositeImages.size > 0 ? Object.fromEntries(compositeImages) : undefined,
        compositeTextOverlays:
          compositeTextOverlays.size > 0 ? [...compositeTextOverlays] : undefined,
        sectionSummaries: sectionSummaries.length > 0 ? sectionSummaries : undefined,
      },
    };
  }

  /**
   * Extract design tokens from a Figma file
   */
  private async fetchDesignTokens(
    fileKey: string,
    options?: FigmaIntegrationOptions
  ): Promise<IntegrationResult> {
    const token = await this.getApiKey('token');
    const format = options?.tokenFormat || 'css';

    const file = await this.apiRequest<FigmaFile>(token, `/files/${fileKey}`);
    const tokens = extractTokensFromFile(file);
    const formatted = formatTokens(tokens, format);

    const tokenCounts = {
      colors: Object.keys(tokens.colors).length,
      typography: Object.keys(tokens.typography).length,
      shadows: Object.keys(tokens.shadows).length,
      radii: Object.keys(tokens.radii).length,
      spacing: Object.keys(tokens.spacing).length,
    };

    const ext = format === 'tailwind' ? 'js' : format;
    const content = `# Design Tokens: ${file.name}

Extracted ${Object.values(tokenCounts).reduce((a, b) => a + b, 0)} tokens from Figma.

- Colors: ${tokenCounts.colors}
- Typography: ${tokenCounts.typography}
- Shadows: ${tokenCounts.shadows}
- Border Radii: ${tokenCounts.radii}
- Spacing: ${tokenCounts.spacing}

\`\`\`${ext}
${formatted}
\`\`\`
`;

    return {
      content,
      source: `figma:${fileKey}:tokens`,
      title: `${file.name} - Design Tokens`,
      metadata: {
        type: 'figma',
        mode: 'tokens',
        format,
        fileKey,
        tokenCounts,
      },
    };
  }

  /**
   * Generate component code from Figma components
   */
  private async fetchAndGenerateComponents(
    fileKey: string,
    nodeIds: string[],
    options?: FigmaIntegrationOptions
  ): Promise<IntegrationResult> {
    const token = await this.getApiKey('token');
    const framework = options?.framework || 'react';

    let components: FigmaNode[];
    let fileName: string;

    if (nodeIds.length > 0) {
      // Fetch specific nodes
      const response = await this.apiRequest<FigmaNodesResponse>(
        token,
        `/files/${fileKey}/nodes?ids=${formatNodeIds(nodeIds)}`
      );
      fileName = response.name;
      components = Object.values(response.nodes).map((n) => n.document);
    } else {
      // Fetch file and find all components
      const file = await this.apiRequest<FigmaFile>(token, `/files/${fileKey}`);
      fileName = file.name;
      components = this.findComponents(file.document);
    }

    if (components.length === 0) {
      return {
        content:
          '# No Components Found\n\nNo components were found in the specified file or nodes. ' +
          'Try specifying component node IDs directly.',
        source: `figma:${fileKey}:components`,
        title: 'Components',
        metadata: { type: 'figma', mode: 'components', count: 0 },
      };
    }

    const sections: string[] = [`# Generated Components: ${fileName}\n`];
    sections.push(`Framework: **${framework}**\n`);
    sections.push(`Found ${components.length} component(s).\n`);

    const ext = getFileExtension(framework);

    for (const component of components) {
      const code = figmaNodeToComponent(component, framework);
      sections.push(`## ${component.name}\n`);
      sections.push(`\`\`\`${ext}\n${code}\n\`\`\`\n`);
    }

    return {
      content: sections.join('\n'),
      source: `figma:${fileKey}:components`,
      title: `${fileName} - Components`,
      metadata: {
        type: 'figma',
        mode: 'components',
        framework,
        fileKey,
        componentCount: components.length,
      },
    };
  }

  /**
   * Export assets (icons, images) from Figma
   */
  private async fetchAssets(
    fileKey: string,
    nodeIds: string[],
    options?: FigmaIntegrationOptions
  ): Promise<IntegrationResult> {
    const token = await this.getApiKey('token');
    const format = options?.assetFormat || 'svg';
    const scale = options?.scale || 1;

    // If no specific nodes, find asset nodes
    if (nodeIds.length === 0) {
      const file = await this.apiRequest<FigmaFile>(token, `/files/${fileKey}`);
      nodeIds = this.findAssetNodes(file.document);
    }

    if (nodeIds.length === 0) {
      return {
        content:
          '# No Assets Found\n\n' +
          'No icon or asset nodes were found in the file. Assets are identified by names containing ' +
          '"icon", "asset", "logo", or "illustration".\n\n' +
          'Try specifying node IDs directly with `--figma-nodes`.',
        source: `figma:${fileKey}:assets`,
        title: 'Assets',
        metadata: { type: 'figma', mode: 'assets', count: 0 },
      };
    }

    // Request image exports
    const imageResponse = await this.apiRequest<FigmaImagesResponse>(
      token,
      `/images/${fileKey}?ids=${formatNodeIds(nodeIds)}&format=${format}&scale=${scale}`
    );

    if (imageResponse.err) {
      this.error(`Figma image export failed: ${imageResponse.err}`);
    }

    // Build asset list
    const assets: Array<{ id: string; url: string | null; filename: string }> = [];

    for (const [nodeId, url] of Object.entries(imageResponse.images)) {
      assets.push({
        id: nodeId,
        url,
        filename: `${nodeIdToFilename(nodeId)}.${format}`,
      });
    }

    const validAssets = assets.filter((a) => a.url !== null);

    // Generate markdown with download instructions
    const sections: string[] = ['# Figma Assets Export\n'];
    sections.push(`Found **${validAssets.length}** assets to export.\n`);
    sections.push(`Format: **${format.toUpperCase()}** | Scale: **${scale}x**\n`);

    if (validAssets.length > 0) {
      sections.push('## Asset List\n');
      sections.push('| Node ID | Filename | Download |');
      sections.push('|---------|----------|----------|');

      for (const asset of validAssets) {
        sections.push(`| ${asset.id} | ${asset.filename} | [Link](${asset.url}) |`);
      }

      sections.push('\n## Download Script\n');
      sections.push('Run this script to download all assets:\n');
      sections.push('```bash');
      sections.push('# Create assets directory');
      sections.push('mkdir -p assets\n');

      for (const asset of validAssets) {
        sections.push(`curl -o "assets/${asset.filename}" "${asset.url}"`);
      }

      sections.push('```\n');

      sections.push(
        '> **Note:** Export URLs expire after 30 days. Re-run the fetch to get fresh URLs.\n'
      );
    }

    return {
      content: sections.join('\n'),
      source: `figma:${fileKey}:assets`,
      title: 'Assets Export',
      metadata: {
        type: 'figma',
        mode: 'assets',
        format,
        scale,
        fileKey,
        count: validAssets.length,
        assets: validAssets,
      },
    };
  }

  /**
   * Fetch download URLs for all image fills in a Figma file.
   * Uses the /files/{key}/images endpoint which returns URLs for all imageRef values.
   */
  private async fetchImageFillUrls(
    fileKey: string,
    token: string
  ): Promise<Record<string, string>> {
    const response = await this.apiRequest<FigmaImageFillsResponse>(
      token,
      `/files/${fileKey}/images`
    );
    return response.meta?.images || {};
  }

  /**
   * Collect top-level frame IDs for rendering as screenshots.
   * Uses selectPrimaryFrames to avoid screenshotting duplicate frames.
   * Returns up to `limit` frame IDs.
   */
  private collectTopLevelFrameIds(nodes: FigmaNode[], limit: number): string[] {
    const frameIds: string[] = [];
    for (const node of nodes) {
      if (node.type === 'CANVAS' && node.children) {
        const primary = selectPrimaryFrames(node.children);
        for (const child of primary) {
          if (child.type === 'FRAME' && child.visible !== false) {
            frameIds.push(child.id);
            if (frameIds.length >= limit) return frameIds;
          }
        }
      } else if (node.type === 'FRAME' && node.visible !== false) {
        // When specific nodes were requested, they may already be frames
        frameIds.push(node.id);
        if (frameIds.length >= limit) return frameIds;
      }
    }
    return frameIds;
  }

  /**
   * Extract text content and information architecture from Figma
   */
  private async fetchContentExtraction(
    fileKey: string,
    nodeIds: string[],
    options?: FigmaIntegrationOptions
  ): Promise<IntegrationResult> {
    const token = await this.getApiKey('token');

    let nodes: FigmaNode[];
    let fileName: string;

    if (nodeIds.length > 0) {
      // Fetch specific nodes
      const response = await this.apiRequest<FigmaNodesResponse>(
        token,
        `/files/${fileKey}/nodes?ids=${formatNodeIds(nodeIds)}`
      );
      fileName = response.name;
      nodes = Object.values(response.nodes).map((n) => n.document);
    } else {
      // Fetch entire file
      const file = await this.apiRequest<FigmaFile>(token, `/files/${fileKey}`);
      fileName = file.name;
      nodes = file.document.children || [];
    }

    // Extract content from nodes
    const extracted = extractContent(nodes, fileName);

    // Format output as markdown with JSON structure
    const content = formatContentAsMarkdown(extracted);

    return {
      content,
      source: `figma:${fileKey}:content`,
      title: `${fileName} - Content Extraction`,
      metadata: {
        type: 'figma',
        mode: 'content',
        fileKey,
        target: options?.target,
        preview: options?.preview,
        mapping: options?.mapping,
        stats: extracted.stats,
        navigation: extracted.navigation,
        extractedContent: extracted,
      },
    };
  }

  /**
   * Find component nodes in a document
   */
  private findComponents(node: FigmaNode, results: FigmaNode[] = []): FigmaNode[] {
    if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
      results.push(node);
    }

    if (node.children) {
      for (const child of node.children) {
        this.findComponents(child, results);
      }
    }

    return results;
  }

  /**
   * Find asset nodes (icons, logos, etc.) in a document
   */
  private findAssetNodes(node: FigmaNode, results: string[] = []): string[] {
    const assetPatterns = /icon|asset|logo|illustration|image|graphic/i;

    // Check if this node looks like an asset
    if (assetPatterns.test(node.name)) {
      // Only include frames, components, and vector nodes
      if (['FRAME', 'COMPONENT', 'VECTOR', 'GROUP', 'INSTANCE'].includes(node.type)) {
        results.push(node.id);
      }
    }

    // Recurse into children
    if (node.children) {
      for (const child of node.children) {
        this.findAssetNodes(child, results);
      }
    }

    return results;
  }

  // ============================================
  // Response cache — avoids repeated API calls during development/testing.
  // Cached in ~/.ralph/figma-cache/ with a 1-hour TTL.
  // On 429, falls back to stale cache if available.
  // ============================================

  private static readonly CACHE_DIR = join(homedir(), '.ralph', 'figma-cache');
  private static readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  private getCachePath(path: string): string {
    const hash = createHash('sha256').update(path).digest('hex').slice(0, 16);
    return join(FigmaIntegration.CACHE_DIR, `${hash}.json`);
  }

  private readCache<T>(path: string): { data: T; fresh: boolean } | null {
    const cachePath = this.getCachePath(path);
    try {
      if (!existsSync(cachePath)) return null;
      const stat = statSync(cachePath);
      const age = Date.now() - stat.mtimeMs;
      const data = JSON.parse(readFileSync(cachePath, 'utf-8')) as T;
      return { data, fresh: age < FigmaIntegration.CACHE_TTL_MS };
    } catch {
      return null;
    }
  }

  private writeCache(path: string, data: unknown): void {
    try {
      if (!existsSync(FigmaIntegration.CACHE_DIR)) {
        mkdirSync(FigmaIntegration.CACHE_DIR, { recursive: true });
      }
      writeFileSync(this.getCachePath(path), JSON.stringify(data));
    } catch {
      // Cache write failed — non-critical
    }
  }

  /**
   * Make an API request to Figma with timeout, caching, and single retry on 429.
   * @param essential - If true, retries once on 429. If false, throws immediately on 429.
   */
  private async apiRequest<T>(token: string, path: string, essential = true): Promise<T> {
    const timeoutMs = 30_000;
    const maxAttempts = essential ? 2 : 1; // Only retry essential calls
    const debug = !!process.env.RALPH_DEBUG;

    // Return fresh cache hit immediately (skip API call entirely)
    const cached = this.readCache<T>(path);
    if (cached?.fresh) {
      if (debug) {
        console.log(`  [figma debug] cache hit (fresh) for ${path.split('?')[0]}`);
      }
      return cached.data;
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      if (debug) {
        console.log(
          `  [figma debug] ${essential ? 'essential' : 'optional'} GET ${path} (attempt ${attempt + 1}/${maxAttempts})`
        );
      }

      let response: Response;
      try {
        response = await fetch(`${this.API_BASE}${path}`, {
          headers: { 'X-Figma-Token': token },
          signal: controller.signal,
        });
      } catch (err: unknown) {
        clearTimeout(timer);
        if (err instanceof Error && err.name === 'AbortError') {
          // On timeout, try stale cache before failing
          if (cached) {
            if (debug) console.log(`  [figma debug] timeout — using stale cache`);
            console.log('  Using cached Figma data (API timed out)');
            return cached.data;
          }
          this.error(
            `Figma API request timed out after ${timeoutMs / 1000}s. The file may be too large — try fetching specific frames with --figma-nodes.`
          );
        }
        throw err;
      } finally {
        clearTimeout(timer);
      }

      if (debug) {
        const retryAfter = response.headers.get('retry-after');
        console.log(
          `  [figma debug] ${response.status} ${response.statusText}${retryAfter ? ` (retry-after: ${retryAfter}s)` : ''}`
        );
      }

      if (response.status === 429) {
        // On rate limit, use stale cache if available (skip retry entirely)
        if (cached) {
          if (debug) console.log(`  [figma debug] 429 — using stale cache`);
          console.log('  Using cached Figma data (API rate limited)');
          return cached.data;
        }

        // Extract rate limit diagnostic headers
        const retryAfter = response.headers.get('retry-after');
        const planTier = response.headers.get('x-figma-plan-tier');
        const limitType = response.headers.get('x-figma-rate-limit-type');
        const retrySeconds = retryAfter ? Number.parseInt(retryAfter, 10) : null;

        // Flag low-budget plans so we skip non-essential calls later
        if (limitType === 'low' || planTier === 'starter') {
          this.lowBudget = true;
        }

        if (debug) {
          console.log(
            `  [figma debug] plan=${planTier} limit-type=${limitType} retry-after=${retryAfter}s`
          );
        }

        // CloudFront-level block: retry-after > 1 hour means CDN throttling, not transient rate limit.
        // Retrying is pointless — fail fast with actionable advice.
        if (retrySeconds && retrySeconds > 3600) {
          const days = Math.ceil(retrySeconds / 86400);
          const hints = [
            `Figma API blocked for ~${days} day(s) (CDN-level throttle).`,
            planTier ? `  Plan tier: ${planTier} | Limit type: ${limitType || 'unknown'}` : '',
            "  This often happens with community files — the file owner's plan sets your rate limits.",
            '  Workarounds:',
            '    1. Duplicate the file to your own Figma workspace (fixes owner-plan limits)',
            '    2. Use a VPN to get a fresh IP (bypasses CDN throttle)',
            '    3. Upgrade to a Figma paid plan with a Dev seat (10+ req/min)',
          ]
            .filter(Boolean)
            .join('\n');
          this.error(hints);
        }

        if (attempt + 1 < maxAttempts) {
          // Wait and retry once for essential calls.
          // IMPORTANT: respect Figma's retry-after header (typically 30-60s).
          // Retrying too early resets the cooldown and makes things worse.
          const waitMs = Math.min(retrySeconds ? retrySeconds * 1000 : 30_000, 60_000);
          console.log(
            `  Figma rate limit hit — waiting ${Math.ceil(waitMs / 1000)}s before retry...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }
        this.error(
          `Figma API rate limit hit on ${path.split('?')[0]}. ` +
            'Wait 1-2 minutes before trying again.'
        );
      }

      if (!response.ok) {
        if (response.status === 401) {
          this.error(
            'Invalid Figma token. Get a Personal Access Token from Figma settings and run:\n' +
              'ralph-starter config set figma.token <your-token>'
          );
        }
        if (response.status === 403) {
          this.error('Access denied. Make sure your token has access to this file.');
        }
        if (response.status === 404) {
          this.error('File not found. Check the file key or URL is correct.');
        }

        const error = (await response.json().catch(() => ({}))) as { message?: string };
        this.error(`Figma API error: ${response.status} - ${error.message || response.statusText}`);
      }

      const data = (await response.json()) as T;
      this.writeCache(path, data);
      return data;
    }

    throw new Error('Figma API request failed after retries');
  }

  getHelp(): string {
    return `
figma: Fetch design specs, tokens, components, assets, and content from Figma

Usage:
  ralph-starter run --from figma --project "<file-url-or-key>" [options]
  ralph-starter integrations fetch figma "<file-url-or-key>" [options]

Options:
  --project       Figma file URL or key
  --figma-mode    Mode: spec (default), tokens, components, assets, content
  --figma-format  Token format: css, scss, json, tailwind
  --figma-framework  Component framework: react, vue, svelte, astro, nextjs, nuxt, html
  --figma-nodes   Specific node IDs (comma-separated)
  --figma-scale   Image export scale (default: 1)
  --figma-target  Target directory for content mode
  --figma-preview Show changes without applying (content mode)
  --figma-mapping Custom content mapping file (content mode)

Authentication:
  1. Go to Figma > Settings > Account > Personal Access Tokens
  2. Create a new token
  3. Run: ralph-starter config set figma.token <your-token>

  Or use environment variable:
    export FIGMA_TOKEN=<your-token>

Examples:
  # Fetch design spec (for AI coding loop)
  ralph-starter run --from figma --project "https://figma.com/file/ABC123/MyDesign"

  # Extract design tokens as CSS
  ralph-starter integrations fetch figma "ABC123" --figma-mode tokens

  # Generate React components
  ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework react

  # Export all icons as SVG
  ralph-starter integrations fetch figma "ABC123" --figma-mode assets

  # Extract content and information architecture
  ralph-starter run --from figma:<file-url> --figma-mode content

  # Extract content for specific directory
  ralph-starter run --from figma:<file-url> --figma-mode content --figma-target "src/pages"

  # Preview content extraction without applying
  ralph-starter run --from figma:<file-url> --figma-mode content --figma-preview

  # Fetch specific frames by node ID
  ralph-starter integrations fetch figma "ABC123" --figma-nodes "1:23,1:45"

Modes:
  spec        Convert Figma frames to markdown design specifications
  tokens      Extract colors, typography, shadows as CSS/SCSS/JSON/Tailwind
  components  Generate component code (React, Vue, Svelte, Astro, Next.js, Nuxt, HTML)
  assets      Export icons and images with download scripts
  content     Extract text content and IA for applying to existing templates

Rate Limits:
  - Starter plan (Collab seat): 6 requests/month — upgrade for serious use
  - Professional plan (Dev seat, $12/mo): 10-50 requests/min
  - Responses are cached in ~/.ralph/figma-cache/ (1h TTL)
  - On rate limit (429), stale cache is used automatically
  - Community files use the file owner's plan limits, not yours
  - Debug with: RALPH_DEBUG=1 ralph-starter run --from figma ...

Notes:
  - Figma file URLs can include node selections: ?node-id=X:Y
  - Asset export URLs expire after 30 days
  - Variables API requires Figma Enterprise plan
  - Content mode extracts text with semantic roles (heading, body, button, etc.)
`.trim();
  }
}
