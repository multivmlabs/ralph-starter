/**
 * Figma Plan Generator
 *
 * Extracts structured section summaries from Figma nodes and generates
 * a detailed IMPLEMENTATION_PLAN.md with concrete design values
 * (dimensions, layout, colors, typography, images) per section.
 */

import type { FigmaNode, Paint } from '../types.js';
import { formatGradient, rgbaToCss, selectPrimaryFrames } from './design-spec.js';

// ─── Types ──────────────────────────────────────────────────

export interface NotableComponent {
  /** Component name from Figma */
  name: string;
  /** Semantic category */
  category: 'indicator' | 'sidebar' | 'nav' | 'footer' | 'decorative' | 'other';
  /** Absolute position within the section */
  position: { x: number; y: number } | null;
  /** Element dimensions */
  dimensions: { width: number; height: number } | null;
  /** All text content found within this component */
  textContent: string[];
  /** Whether the element overlaps siblings (needs absolute/fixed positioning) */
  isOverlapping: boolean;
  /** Position hint relative to section (e.g. "right-80 top-326") */
  positionHint: string | null;
  /** Scroll behavior if the element or a child has FIXED/STICKY positioning */
  scrollBehavior?: 'fixed' | 'sticky';
}

export interface SectionSummary {
  name: string;
  dimensions: { width: number; height: number } | null;
  layout: {
    direction: 'horizontal' | 'vertical' | null;
    gap: number | null;
    rowGap: number | null;
    padding: string | null;
    mainAlign: string | null;
    crossAlign: string | null;
    wrap: boolean;
  } | null;
  background: string | null;
  images: Array<{
    path: string;
    scaleMode: string;
    isHero: boolean;
    dimensions: string;
  }>;
  compositeImage: { path: string; dimensions: string; hasTextOverlays?: boolean } | null;
  icons: string[];
  typography: Array<{
    font: string;
    size: number;
    weight: number;
    lineHeight: number | null;
    color: string | null;
    usage: string;
  }>;
  borderRadius: string | null;
  overflow: string | null;
  scrollBehavior: string | null;
  effects: string[];
  border: string | null;
  childCount: number;
  /** Notable sub-components that need explicit implementation (indicators, sidebars, etc.) */
  notableComponents: NotableComponent[];
}

export interface SectionSummaryOptions {
  imageFillUrls?: Record<string, string>;
  compositeImages?: Map<string, string>;
  /** Node IDs of composites that have text overlays (visual-dominant composites) */
  compositeTextOverlays?: Set<string>;
  exportedIcons?: Map<string, string>;
  fontSubstitutions?: Map<string, string>;
}

export interface FigmaPlanOptions {
  fileName: string;
  projectStack?: string | null;
  imagesDownloaded?: boolean;
  hasDesignTokens?: boolean;
  iconFilenames?: string[];
  fontNames?: string[];
}

// ─── Alignment mapping ──────────────────────────────────────

const ALIGN_MAP: Record<string, string> = {
  MIN: 'start',
  CENTER: 'center',
  MAX: 'end',
  SPACE_BETWEEN: 'space-between',
  BASELINE: 'baseline',
};

// ─── Section Summary Extraction ─────────────────────────────

/**
 * Extract structured summaries from top-level Figma sections.
 *
 * Walks direct FRAME children of CANVAS nodes (or specific requested nodes)
 * and extracts layout, colors, typography, images, etc. from each section.
 */
export function extractSectionSummaries(
  nodes: FigmaNode[],
  options?: SectionSummaryOptions
): SectionSummary[] {
  const sections: SectionSummary[] = [];

  for (const node of nodes) {
    if (node.visible === false) continue;

    if (node.type === 'CANVAS' && node.children) {
      // Page node — select only the primary frame to avoid duplication
      const primaryChildren = selectPrimaryFrames(node.children);
      for (const child of primaryChildren) {
        if (child.type === 'FRAME' || child.type === 'COMPONENT' || child.type === 'SECTION') {
          sections.push(extractOneSection(child, options));
        }
      }
    } else if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'SECTION') {
      // Directly requested node — treat as a section
      sections.push(extractOneSection(node, options));
    }
  }

  return sections;
}

function extractOneSection(node: FigmaNode, options?: SectionSummaryOptions): SectionSummary {
  const bbox = node.absoluteBoundingBox;

  return {
    name: node.name,
    dimensions: bbox ? { width: Math.round(bbox.width), height: Math.round(bbox.height) } : null,
    layout: extractLayout(node),
    background: extractBackground(node),
    images: extractImages(node, options),
    compositeImage: extractCompositeImage(node, options),
    icons: extractIcons(node, options),
    typography: extractTypography(node, options),
    borderRadius: extractBorderRadius(node),
    overflow: node.clipsContent ? 'hidden' : null,
    scrollBehavior: extractScrollBehavior(node),
    effects: extractEffects(node),
    border: extractBorder(node),
    childCount: node.children?.filter((c) => c.visible !== false).length ?? 0,
    notableComponents: extractNotableComponents(node),
  };
}

// ─── Property Extractors ────────────────────────────────────

function extractLayout(node: FigmaNode): SectionSummary['layout'] {
  if (!node.layoutMode || node.layoutMode === 'NONE') return null;

  const pt = node.paddingTop || 0;
  const pr = node.paddingRight || 0;
  const pb = node.paddingBottom || 0;
  const pl = node.paddingLeft || 0;
  const hasPadding = pt > 0 || pr > 0 || pb > 0 || pl > 0;

  return {
    direction: node.layoutMode === 'HORIZONTAL' ? 'horizontal' : 'vertical',
    gap: node.itemSpacing ?? null,
    rowGap: node.counterAxisSpacing ?? null,
    padding: hasPadding ? `${pt}px ${pr}px ${pb}px ${pl}px` : null,
    mainAlign: node.primaryAxisAlignItems ? (ALIGN_MAP[node.primaryAxisAlignItems] ?? null) : null,
    crossAlign: node.counterAxisAlignItems ? (ALIGN_MAP[node.counterAxisAlignItems] ?? null) : null,
    wrap: node.layoutWrap === 'WRAP',
  };
}

function extractBackground(node: FigmaNode): string | null {
  if (!node.fills) return null;

  for (const fill of node.fills) {
    if (fill.visible === false) continue;
    if (fill.type === 'SOLID' && fill.color) {
      return rgbaToCss(fill.color, fill.opacity);
    }
    if (fill.type.startsWith('GRADIENT_') && fill.gradientStops) {
      return formatGradient(fill);
    }
  }
  return null;
}

function extractImages(node: FigmaNode, options?: SectionSummaryOptions): SectionSummary['images'] {
  const images: SectionSummary['images'] = [];
  walkForImages(node, images, options, 0);
  return images;
}

function walkForImages(
  node: FigmaNode,
  images: SectionSummary['images'],
  options: SectionSummaryOptions | undefined,
  depth: number
): void {
  if (node.visible === false || depth > 6) return;

  if (node.fills) {
    const imageFills = node.fills.filter(
      (f) => f.type === 'IMAGE' && f.visible !== false && f.imageRef
    );
    for (const fill of imageFills) {
      const bbox = node.absoluteBoundingBox;
      const ref = fill.imageRef ?? '';
      const hasDownload = ref && options?.imageFillUrls?.[ref];
      const path = hasDownload
        ? `/images/${ref}.png`
        : bbox
          ? `placehold.co/${Math.round(bbox.width)}x${Math.round(bbox.height)}`
          : 'placehold.co/400x300';
      const isHero = !!node.children?.length && !!bbox && bbox.height >= 400 && depth <= 1;
      images.push({
        path,
        scaleMode: fill.scaleMode || 'FILL',
        isHero,
        dimensions: bbox ? `${Math.round(bbox.width)}x${Math.round(bbox.height)}` : '',
      });
    }
  }

  if (node.children) {
    for (const child of node.children) {
      walkForImages(child, images, options, depth + 1);
    }
  }
}

function extractCompositeImage(
  node: FigmaNode,
  options?: SectionSummaryOptions
): SectionSummary['compositeImage'] {
  if (!options?.compositeImages) return null;

  // Check if this section itself is a composite
  const path = options.compositeImages.get(node.id);
  if (path) {
    const bbox = node.absoluteBoundingBox;
    return {
      path,
      dimensions: bbox ? `${Math.round(bbox.width)}x${Math.round(bbox.height)}` : '',
      hasTextOverlays: options.compositeTextOverlays?.has(node.id),
    };
  }

  // Check direct children for composites
  if (node.children) {
    for (const child of node.children) {
      if (child.visible === false) continue;
      const childPath = options.compositeImages.get(child.id);
      if (childPath) {
        const bbox = child.absoluteBoundingBox;
        return {
          path: childPath,
          dimensions: bbox ? `${Math.round(bbox.width)}x${Math.round(bbox.height)}` : '',
          hasTextOverlays: options.compositeTextOverlays?.has(child.id),
        };
      }
    }
  }
  return null;
}

function extractIcons(node: FigmaNode, options?: SectionSummaryOptions): string[] {
  if (!options?.exportedIcons) return [];
  const icons: string[] = [];
  walkForIcons(node, icons, options.exportedIcons, 0);
  return icons;
}

function walkForIcons(
  node: FigmaNode,
  icons: string[],
  exportedIcons: Map<string, string>,
  depth: number
): void {
  if (node.visible === false || depth > 6) return;

  const iconFile = exportedIcons.get(node.id);
  if (iconFile) {
    icons.push(`/images/icons/${iconFile}`);
  }

  if (node.children) {
    for (const child of node.children) {
      walkForIcons(child, icons, exportedIcons, depth + 1);
    }
  }
}

function extractTypography(
  node: FigmaNode,
  options?: SectionSummaryOptions
): SectionSummary['typography'] {
  const styles: SectionSummary['typography'] = [];
  walkForTypography(node, styles, options, 0);
  return deduplicateTypography(styles);
}

function walkForTypography(
  node: FigmaNode,
  styles: SectionSummary['typography'],
  options: SectionSummaryOptions | undefined,
  depth: number
): void {
  if (node.visible === false || depth > 6) return;

  if (node.type === 'TEXT' && node.style) {
    const s = node.style;
    const fontName = options?.fontSubstitutions?.get(s.fontFamily) ?? s.fontFamily;

    // Extract text color from style fills
    let color: string | null = null;
    if (s.fills) {
      const solidFill = s.fills.find(
        (f: Paint) => f.visible !== false && f.type === 'SOLID' && f.color
      );
      if (solidFill?.color) {
        color = rgbaToCss(solidFill.color, solidFill.opacity);
      }
    }

    styles.push({
      font: fontName,
      size: s.fontSize,
      weight: s.fontWeight,
      lineHeight: s.lineHeightPx ? Math.round(s.lineHeightPx) : null,
      color,
      usage: node.name || 'text',
    });
  }

  if (node.children) {
    for (const child of node.children) {
      walkForTypography(child, styles, options, depth + 1);
    }
  }
}

/**
 * Deduplicate typography by font+size+weight, keeping the most descriptive usage label.
 * Limit to 4 unique styles per section.
 */
function deduplicateTypography(styles: SectionSummary['typography']): SectionSummary['typography'] {
  const seen = new Map<string, SectionSummary['typography'][0]>();

  for (const style of styles) {
    const key = `${style.font}-${style.size}-${style.weight}`;
    if (!seen.has(key)) {
      seen.set(key, style);
    }
  }

  // Sort by size descending (largest = heading, smallest = detail)
  const unique = [...seen.values()].sort((a, b) => b.size - a.size);
  return unique.slice(0, 4);
}

function extractBorderRadius(node: FigmaNode): string | null {
  if (node.cornerRadius && node.cornerRadius > 0) {
    return `${node.cornerRadius}px`;
  }
  if (node.rectangleCornerRadii) {
    const [tl, tr, br, bl] = node.rectangleCornerRadii;
    if (tl > 0 || tr > 0 || br > 0 || bl > 0) {
      return `${tl}px ${tr}px ${br}px ${bl}px`;
    }
  }
  return null;
}

function extractScrollBehavior(node: FigmaNode): string | null {
  if (!node.scrollBehavior || node.scrollBehavior === 'SCROLLS') return null;
  if (node.scrollBehavior === 'FIXED') return 'fixed';
  if (node.scrollBehavior === 'STICKY_SCROLLS') return 'sticky';
  return null;
}

function extractEffects(node: FigmaNode): string[] {
  if (!node.effects) return [];
  const results: string[] = [];
  for (const effect of node.effects) {
    if (effect.visible === false) continue;
    if (effect.type === 'DROP_SHADOW' && effect.color && effect.offset) {
      const color = rgbaToCss(effect.color);
      results.push(
        `box-shadow: ${effect.offset.x}px ${effect.offset.y}px ${effect.radius}px${effect.spread ? ` ${effect.spread}px` : ''} ${color}`
      );
    } else if (effect.type === 'INNER_SHADOW' && effect.color && effect.offset) {
      const color = rgbaToCss(effect.color);
      results.push(
        `box-shadow: inset ${effect.offset.x}px ${effect.offset.y}px ${effect.radius}px${effect.spread ? ` ${effect.spread}px` : ''} ${color}`
      );
    } else if (effect.type === 'BACKGROUND_BLUR') {
      results.push(`backdrop-filter: blur(${effect.radius}px)`);
    }
  }
  return results;
}

function extractBorder(node: FigmaNode): string | null {
  if (!node.strokes || node.strokes.length === 0) return null;

  for (const stroke of node.strokes) {
    if (stroke.visible === false) continue;
    if (stroke.type === 'SOLID' && stroke.color) {
      const color = rgbaToCss(stroke.color, stroke.opacity);
      const weight = node.strokeWeight || 1;
      const style = node.strokeDashes?.length ? 'dashed' : 'solid';

      if (node.individualStrokeWeights) {
        const { top, right, bottom, left } = node.individualStrokeWeights;
        const sides: string[] = [];
        if (top > 0) sides.push(`border-top: ${top}px ${style} ${color}`);
        if (right > 0) sides.push(`border-right: ${right}px ${style} ${color}`);
        if (bottom > 0) sides.push(`border-bottom: ${bottom}px ${style} ${color}`);
        if (left > 0) sides.push(`border-left: ${left}px ${style} ${color}`);
        return sides.join(', ');
      }
      return `${weight}px ${style} ${color}`;
    }
  }
  return null;
}

// ─── Notable Component Detection ────────────────────────────

/**
 * Keyword patterns for classifying notable sub-components.
 */
const CATEGORY_PATTERNS: Array<{ pattern: RegExp; category: NotableComponent['category'] }> = [
  { pattern: /\b(slider|indicator|progress|scroll|stepper)\b/i, category: 'indicator' },
  { pattern: /\b(social|sidebar|follow)\b/i, category: 'sidebar' },
  { pattern: /\b(nav|header|menu|logo|navigation|toolbar)\b/i, category: 'nav' },
  { pattern: /\b(footer|copyright|links)\b/i, category: 'footer' },
];

/**
 * Detect notable sub-components that need explicit implementation guidance.
 *
 * These are elements that overlap siblings (absolutely positioned), sit on
 * the edges of a section (sidebars, indicators), or contain interactive/decorative
 * content that might be missed if the plan only describes top-level layout.
 *
 * Examples: scroll indicators, social sidebars, fixed headers, progress bars.
 */
function extractNotableComponents(sectionNode: FigmaNode): NotableComponent[] {
  const results: NotableComponent[] = [];
  const sectionBbox = sectionNode.absoluteBoundingBox;
  if (!sectionBbox || !sectionNode.children) return results;

  // Only look at direct children of the section (depth 1 sub-components)
  // that are NOT the main content flow (they overlap or sit at edges)
  const visibleChildren = sectionNode.children.filter((c) => c.visible !== false);
  if (visibleChildren.length < 2) return results;

  // If the section has auto-layout, all children are in flow — skip detection
  if (sectionNode.layoutMode && sectionNode.layoutMode !== 'NONE') {
    // Still check for absolutely-positioned children within auto-layout
    for (const child of visibleChildren) {
      if (child.layoutPositioning === 'ABSOLUTE') {
        const component = buildNotableComponent(child, sectionBbox);
        if (component) results.push(component);
      }
    }
    return results;
  }

  // No auto-layout — children overlap. Look for notable sub-components
  // by checking if they have text content and sit at the edges/corners.
  for (const child of visibleChildren) {
    const childBbox = child.absoluteBoundingBox;
    if (!childBbox) continue;

    // Skip very large children that are likely backgrounds or main content containers
    const areaRatio =
      (childBbox.width * childBbox.height) / (sectionBbox.width * sectionBbox.height);
    if (areaRatio > 0.4) continue;

    // Check if this child has text, positioned at an edge, or has fixed scroll
    const textContent = collectAllText(child);
    const hasFixedScroll =
      child.scrollBehavior === 'FIXED' ||
      child.scrollBehavior === 'STICKY_SCROLLS' ||
      child.children?.some(
        (c) => c.scrollBehavior === 'FIXED' || c.scrollBehavior === 'STICKY_SCROLLS'
      );
    if (textContent.length === 0 && !hasFixedScroll) continue;

    // Classify by name and position
    const component = buildNotableComponent(child, sectionBbox);
    if (component) results.push(component);
  }

  return results;
}

/**
 * Build a NotableComponent from a node, computing position hints and text content.
 */
function buildNotableComponent(
  node: FigmaNode,
  sectionBbox: { x: number; y: number; width: number; height: number }
): NotableComponent | null {
  const bbox = node.absoluteBoundingBox;
  if (!bbox) return null;

  const textContent = collectAllText(node);
  // Must have text, notable keyword, or fixed/sticky scroll behavior
  const hasFixedScroll =
    node.scrollBehavior === 'FIXED' ||
    node.scrollBehavior === 'STICKY_SCROLLS' ||
    node.children?.some(
      (c) => c.scrollBehavior === 'FIXED' || c.scrollBehavior === 'STICKY_SCROLLS'
    );
  if (textContent.length === 0 && !hasNotableKeyword(node.name) && !hasFixedScroll) return null;

  // Compute position relative to section
  const relX = Math.round(bbox.x - sectionBbox.x);
  const relY = Math.round(bbox.y - sectionBbox.y);
  const rightOffset = Math.round(sectionBbox.width - (relX + bbox.width));
  const bottomOffset = Math.round(sectionBbox.height - (relY + bbox.height));

  // Generate a CSS-like position hint
  const posHints: string[] = [];
  if (relX < sectionBbox.width / 2) {
    posHints.push(`left: ${relX}px`);
  } else {
    posHints.push(`right: ${rightOffset}px`);
  }
  if (relY < sectionBbox.height / 2) {
    posHints.push(`top: ${relY}px`);
  } else {
    posHints.push(`bottom: ${bottomOffset}px`);
  }

  // Determine category
  let category: NotableComponent['category'] = 'other';
  for (const { pattern, category: cat } of CATEGORY_PATTERNS) {
    if (pattern.test(node.name)) {
      category = cat;
      break;
    }
  }

  // Check if it overlaps with siblings (no auto-layout parent = overlapping)
  const isOverlapping = !node.layoutPositioning
    ? true // Parent has no auto-layout → elements overlap
    : node.layoutPositioning === 'ABSOLUTE';

  // Detect scroll behavior on the node itself or any immediate child
  let scrollBehavior: 'fixed' | 'sticky' | undefined;
  if (node.scrollBehavior === 'FIXED') {
    scrollBehavior = 'fixed';
  } else if (node.scrollBehavior === 'STICKY_SCROLLS') {
    scrollBehavior = 'sticky';
  } else if (node.children) {
    for (const child of node.children) {
      if (child.scrollBehavior === 'FIXED') {
        scrollBehavior = 'fixed';
        break;
      } else if (child.scrollBehavior === 'STICKY_SCROLLS') {
        scrollBehavior = 'sticky';
        break;
      }
    }
  }

  return {
    name: node.name,
    category,
    position: { x: relX, y: relY },
    dimensions: { width: Math.round(bbox.width), height: Math.round(bbox.height) },
    textContent,
    isOverlapping,
    positionHint: posHints.join('; '),
    scrollBehavior,
  };
}

function hasNotableKeyword(name: string): boolean {
  return CATEGORY_PATTERNS.some(({ pattern }) => pattern.test(name));
}

/**
 * Collect all text content strings from a node tree (depth-limited to 6).
 */
function collectAllText(node: FigmaNode, depth = 0): string[] {
  if (depth > 6 || node.visible === false) return [];
  const texts: string[] = [];
  if (node.type === 'TEXT' && node.characters) {
    texts.push(node.characters.trim());
  }
  if (node.children) {
    for (const child of node.children) {
      texts.push(...collectAllText(child, depth + 1));
    }
  }
  return texts;
}

// ─── Plan Generation ────────────────────────────────────────

/**
 * Generate a detailed IMPLEMENTATION_PLAN.md from section summaries.
 */
export function extractFigmaPlan(sections: SectionSummary[], options: FigmaPlanOptions): string {
  const lines: string[] = [];
  let taskNum = 0;

  lines.push(`# Implementation Plan`);
  lines.push(``);
  lines.push(`*Auto-generated from Figma design: "${options.fileName}"*`);
  lines.push(``);

  // Universal design-to-code rules — these apply to EVERY design, not just this one
  lines.push(`## Universal Stacking & Layout Rules`);
  lines.push(``);
  lines.push(
    `> These rules apply to ALL sections. Follow them even when not explicitly repeated per task.`
  );
  lines.push(``);
  lines.push(`**Z-Index Stacking (mandatory):**`);
  lines.push(`- Text and content elements ALWAYS get a higher z-index than visual/image layers`);
  lines.push(`- Background images/decorations: z-index 0–9 (ascending for stacked layers)`);
  lines.push(
    `- Content containers with text: position: relative; z-index: 10 (minimum) — MUST be higher than the highest image layer`
  );
  lines.push(
    `- In parallax/layered heroes with multiple stacked images (e.g. z-0 through z-4), text MUST use z-index: 10+ — never z-1 or z-2 which would be behind higher image layers`
  );
  lines.push(`- Never let a background or decorative image cover text at any viewport size`);
  lines.push(``);
  lines.push(`**Image Responsive Priority:**`);
  lines.push(
    `- Images of people (portraits, photos, team members) are the KEY visual element — NEVER hide them at any breakpoint`
  );
  lines.push(
    `- For person images: use \`object-position: top center\` to keep the face visible when the container crops`
  );
  lines.push(
    `- Large hero/feature images must scale proportionally, never \`display: none\` on smaller screens`
  );
  lines.push(`- Decorative/background images may be hidden on mobile if needed for readability`);
  lines.push(``);
  lines.push(`**Sequential/Numbered Elements:**`);
  lines.push(
    `- When the design shows numbered steps (01, 02, 03) or ordered items (Step 1, Step 2, Step 3), preserve the EXACT layout order and spacing from the design`
  );
  lines.push(
    `- Do not reflow or reorder numbered elements — their visual position must match the design`
  );
  lines.push(`- Maintain consistent spacing between sequential items as specified in the spec`);
  lines.push(``);
  lines.push(`## Tasks`);

  // Task 1: Setup
  taskNum++;
  lines.push(``);
  lines.push(`### Task ${taskNum}: Project setup and design tokens`);
  if (options.projectStack) {
    lines.push(`- [ ] Verify ${options.projectStack} project structure`);
  } else {
    lines.push(`- [ ] Initialize project structure`);
  }
  if (options.hasDesignTokens) {
    lines.push(`- [ ] Configure design tokens in @theme (colors, fonts, spacing from spec)`);
  } else {
    lines.push(`- [ ] Extract colors, fonts, and spacing from spec into CSS variables/@theme`);
  }
  if (options.fontNames && options.fontNames.length > 0) {
    lines.push(`- [ ] Import Google Fonts: ${options.fontNames.join(', ')}`);
  } else {
    lines.push(`- [ ] Import fonts referenced in the spec via Google Fonts`);
  }
  if (options.imagesDownloaded) {
    const totalIcons = options.iconFilenames?.length ?? 0;
    const totalImages = sections.reduce((sum, s) => sum + s.images.length, 0);
    const assetParts: string[] = [];
    if (totalImages > 0) assetParts.push(`${totalImages} image(s) in public/images/`);
    if (totalIcons > 0) assetParts.push(`${totalIcons} icon(s) in public/images/icons/`);
    if (assetParts.length > 0) {
      lines.push(`- [ ] Verify downloaded assets: ${assetParts.join(', ')}`);
    }
  }

  // Per-section tasks
  for (const section of sections) {
    taskNum++;
    const dimStr = section.dimensions
      ? ` (${section.dimensions.width} x ${section.dimensions.height}px)`
      : '';
    lines.push(``);
    lines.push(`### Task ${taskNum}: Implement ${section.name}${dimStr}`);

    // Layout subtask
    if (section.layout) {
      const parts: string[] = [];
      parts.push(`flex ${section.layout.direction || 'column'}`);
      if (section.layout.gap != null) parts.push(`gap ${section.layout.gap}px`);
      if (section.layout.rowGap != null) parts.push(`row-gap ${section.layout.rowGap}px`);
      if (section.layout.padding) parts.push(`padding ${section.layout.padding}`);
      if (section.layout.wrap) parts.push('flex-wrap');
      if (section.layout.mainAlign) parts.push(`main-axis ${section.layout.mainAlign}`);
      if (section.layout.crossAlign) parts.push(`cross-axis ${section.layout.crossAlign}`);
      lines.push(`- [ ] Build layout: ${parts.join(', ')}`);
    } else {
      lines.push(`- [ ] Build ${section.name} layout structure`);
    }

    // Background
    if (section.background) {
      lines.push(`- [ ] Background: ${section.background}`);
    }

    // Composite image
    if (section.compositeImage) {
      const isHero = section.dimensions && section.dimensions.height >= 400;
      if (section.compositeImage.hasTextOverlays) {
        lines.push(
          `- [ ] Add parallax hero background: ${section.compositeImage.path} (${section.compositeImage.dimensions}), full-bleed cover${isHero ? `, min-height ${section.dimensions?.height}px` : ''}`
        );
        lines.push(
          `- [ ] Layer ALL text content over hero background with z-index stacking (text is NOT in the composite image)`
        );
        if (isHero) {
          lines.push(`- [ ] Ensure visual layers create depth effect with text overlaid on top`);
        }
      } else {
        lines.push(
          `- [ ] Add composite background: ${section.compositeImage.path} (${section.compositeImage.dimensions}), cover${isHero ? `, min-height ${section.dimensions?.height}px` : ''}`
        );
        lines.push(`- [ ] Position content over background with z-index layering`);
      }
    } else if (section.images.length > 0) {
      // Detect overlapping full-width images that should create depth/parallax
      const fullWidthImages = section.dimensions
        ? section.images.filter((img) => {
            const [w] = img.dimensions.split('x').map(Number);
            return w >= (section.dimensions?.width ?? 0) * 0.8;
          })
        : [];

      if (fullWidthImages.length > 1) {
        lines.push(
          `- [ ] Layer ${fullWidthImages.length} overlapping images to create depth/parallax effect`
        );
        lines.push(`  * Stack images using absolute positioning with ascending z-index`);
        lines.push(`  * Later images in the list are on top (higher z-index)`);
        for (const img of fullWidthImages) {
          const [w, h] = img.dimensions.split('x').map(Number);
          const aspectRatio = w && h ? ` (aspect-ratio: ${(w / h).toFixed(2)})` : '';
          lines.push(
            `  * ${img.path} (${img.dimensions})${aspectRatio}, ${img.scaleMode.toLowerCase()}`
          );
        }
      }

      for (const img of section.images) {
        if (fullWidthImages.includes(img)) continue; // already listed above
        if (img.isHero) {
          lines.push(
            `- [ ] Add hero background: ${img.path} (${img.dimensions}), cover, min-height from spec`
          );
          lines.push(`- [ ] Position content over background with z-index layering`);
        } else {
          const [w, h] = img.dimensions.split('x').map(Number);
          const aspectRatio = w && h ? `, aspect-ratio: ${(w / h).toFixed(2)}` : '';
          lines.push(
            `- [ ] Add image: ${img.path} (${img.dimensions}${aspectRatio}), ${img.scaleMode.toLowerCase()}`
          );
        }
        // Flag high-priority images that must never be hidden
        const imgName = img.path.toLowerCase();
        if (
          /person|people|portrait|photo|avatar|team|founder|headshot|model|woman|man|face/.test(
            imgName
          )
        ) {
          lines.push(
            `  * **CRITICAL**: Person image — must remain visible at ALL breakpoints (see Universal Rules above)`
          );
        }
      }
    }

    // Icons
    if (section.icons.length > 0) {
      if (section.icons.length <= 3) {
        lines.push(`- [ ] Add icons: ${section.icons.join(', ')}`);
      } else {
        lines.push(`- [ ] Add ${section.icons.length} icons from public/images/icons/`);
      }
    }

    // Notable sub-components (indicators, sidebars, nav elements)
    if (section.notableComponents.length > 0) {
      for (const comp of section.notableComponents) {
        const dimStr = comp.dimensions
          ? ` (${comp.dimensions.width}x${comp.dimensions.height}px)`
          : '';
        const posStr = comp.positionHint ? `, positioned at ${comp.positionHint}` : '';
        const label = comp.category !== 'other' ? `[${comp.category}] ` : '';
        lines.push(`- [ ] ${label}Implement "${comp.name}"${dimStr}${posStr}`);
        if (comp.textContent.length > 0) {
          const textPreview =
            comp.textContent.length <= 6
              ? comp.textContent.map((t) => `"${t}"`).join(', ')
              : `${comp.textContent
                  .slice(0, 6)
                  .map((t) => `"${t}"`)
                  .join(', ')} (+${comp.textContent.length - 6} more)`;
          lines.push(`  * Text content: ${textPreview}`);
        }
        if (comp.scrollBehavior === 'fixed') {
          lines.push(`  * Uses position: fixed — stays visible during scroll (z-index: 50)`);
        } else if (comp.scrollBehavior === 'sticky') {
          lines.push(`  * Uses position: sticky; top: 0 — sticks during scroll`);
        } else if (comp.isOverlapping) {
          lines.push(`  * Uses absolute positioning — match exact position from the design spec`);
        }
        if (comp.category === 'sidebar') {
          lines.push(`  * Social icons should be clickable links (wrap in \`<a>\` with href)`);
        }
      }
    }

    // Typography
    if (section.typography.length > 0) {
      for (const t of section.typography) {
        const parts: string[] = [];
        parts.push(`${t.font} ${t.size}px`);
        if (t.lineHeight) parts.push(`/${t.lineHeight}px`);
        parts.push(`weight ${t.weight}`);
        if (t.color) parts.push(`color ${t.color}`);
        lines.push(`- [ ] ${t.usage}: ${parts.join(' ')}`);
      }
    } else {
      lines.push(`- [ ] Apply typography and text content from spec`);
    }

    // Border
    if (section.border) {
      lines.push(`- [ ] Border: ${section.border}`);
    }

    // Border radius
    if (section.borderRadius) {
      lines.push(`- [ ] Border radius: ${section.borderRadius}`);
    }

    // Effects
    for (const effect of section.effects) {
      lines.push(`- [ ] Effect: ${effect}`);
    }

    // Scroll behavior
    if (section.scrollBehavior) {
      lines.push(
        `- [ ] Scroll behavior: ${section.scrollBehavior} (position: ${section.scrollBehavior}${section.scrollBehavior === 'sticky' ? '; top: 0' : ''})`
      );
    }

    // Responsive — include image-specific guidance when section has images
    const hasPersonImage = section.images.some((img) =>
      /person|people|portrait|photo|avatar|team|founder|headshot|model|woman|man|face/.test(
        img.path.toLowerCase()
      )
    );
    if (hasPersonImage) {
      lines.push(
        `- [ ] Add responsive breakpoints — ensure person images remain visible at all sizes (never display:none; use object-position: top center for cropping)`
      );
    } else {
      lines.push(`- [ ] Add responsive breakpoints`);
    }
  }

  // Detect alternating image placement across content sections
  if (sections.length >= 3) {
    const sectionsWithImages = sections.filter((s) => s.images.length > 0 && !s.compositeImage);
    if (sectionsWithImages.length >= 2) {
      lines.push(``);
      lines.push(
        `> **Layout Pattern:** Content sections with images should use alternating left/right placement. Use \`flex-direction: row\` for odd sections and \`flex-direction: row-reverse\` for even sections (or match the spec's positioning).`
      );
    }
  }

  // Final polish task
  if (sections.length > 1) {
    taskNum++;
    lines.push(``);
    lines.push(`### Task ${taskNum}: Polish and cross-section integration`);
    lines.push(
      `- [ ] Compare implementation against frame screenshots in public/images/screenshots/`
    );
    lines.push(`- [ ] Verify consistent spacing and alignment between sections`);
    lines.push(`- [ ] Test responsive behavior across mobile/tablet/desktop`);
    lines.push(`- [ ] Fix any visual discrepancies`);
  } else if (sections.length === 1) {
    taskNum++;
    lines.push(``);
    lines.push(`### Task ${taskNum}: Polish and verification`);
    lines.push(`- [ ] Compare against frame screenshots in public/images/screenshots/`);
    lines.push(`- [ ] Test responsive behavior`);
  }

  lines.push(``);
  return lines.join('\n');
}
