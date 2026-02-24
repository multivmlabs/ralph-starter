/**
 * Design Spec Parser
 *
 * Converts Figma nodes into markdown design specifications
 * for use as AI coding loop task input.
 */

import type {
  FigmaNode,
  GradientStop,
  ImageFilters,
  Paint,
  RGBA,
  Transform,
  TypeStyle,
} from '../types.js';

export interface SpecOptions {
  /** Font substitution map (original → Google Fonts alternative) */
  fontSubstitutions?: Map<string, string>;
  /** Image fill download URLs (imageRef → URL) */
  imageFillUrls?: Record<string, string>;
  /** Icon node IDs that were exported as SVG (nodeId → filename) */
  exportedIcons?: Map<string, string>;
}

/**
 * Convert Figma nodes to a markdown design specification
 */
export function nodesToSpec(nodes: FigmaNode[], fileName: string, options?: SpecOptions): string {
  const sections: string[] = [`# Design Specification: ${fileName}\n`];

  for (const node of nodes) {
    // Skip invisible nodes
    if (node.visible === false) continue;

    // Process top-level pages/canvases
    if (node.type === 'CANVAS') {
      sections.push(`## Page: ${node.name}\n`);
      if (node.children) {
        for (const child of node.children) {
          sections.push(nodeToMarkdown(child, 2, options));
        }
      }
    } else {
      sections.push(nodeToMarkdown(node, 1, options));
    }
  }

  return sections.join('\n');
}

/**
 * Convert a single Figma node to markdown
 */
function nodeToMarkdown(node: FigmaNode, depth: number, options?: SpecOptions): string {
  // Skip invisible nodes
  if (node.visible === false) return '';

  const lines: string[] = [];
  const heading = '#'.repeat(Math.min(depth + 1, 6));

  // Add heading with node name
  lines.push(`${heading} ${node.name}`);

  // Add type badge
  lines.push(`\n*Type: ${formatNodeType(node.type)}*`);

  // Add dimensions and position if available
  if (node.absoluteBoundingBox) {
    const { x, y, width, height } = node.absoluteBoundingBox;
    lines.push(
      `*Dimensions: ${Math.round(width)} x ${Math.round(height)} px — Position: (${Math.round(x)}, ${Math.round(y)})*`
    );
  }

  // Add description if available (frame descriptions are great for specs)
  if (node.description) {
    lines.push(`\n${node.description}`);
  }

  // Add layout info for auto-layout frames
  if (node.layoutMode && node.layoutMode !== 'NONE') {
    lines.push(`\n**Layout:** ${node.layoutMode.toLowerCase()}`);
    // Container sizing
    const hSize = formatLayoutSizing(node.layoutSizingHorizontal, 'width');
    const vSize = formatLayoutSizing(node.layoutSizingVertical, 'height');
    if (hSize) lines.push(`- Width sizing: ${hSize}`);
    if (vSize) lines.push(`- Height sizing: ${vSize}`);
    // Flex wrap
    if (node.layoutWrap === 'WRAP') {
      lines.push(`- Wrap: flex-wrap: wrap`);
    }
    if (node.itemSpacing) {
      lines.push(`- Gap: ${node.itemSpacing}px`);
    }
    if (node.counterAxisSpacing) {
      lines.push(`- Row gap: ${node.counterAxisSpacing}px`);
    }
    if (node.paddingTop || node.paddingRight || node.paddingBottom || node.paddingLeft) {
      lines.push(
        `- Padding: ${node.paddingTop || 0}px ${node.paddingRight || 0}px ${node.paddingBottom || 0}px ${node.paddingLeft || 0}px`
      );
    }
    if (node.primaryAxisAlignItems) {
      lines.push(`- Main axis: ${formatAlignment(node.primaryAxisAlignItems)}`);
    }
    if (node.counterAxisAlignItems) {
      lines.push(`- Cross axis: ${formatAlignment(node.counterAxisAlignItems)}`);
    }
  }

  // Add flex grow
  if (node.layoutGrow && node.layoutGrow > 0) {
    lines.push(`- Flex grow: ${node.layoutGrow}`);
  }

  // Child sizing within parent's auto-layout (only when this is NOT a layout container itself)
  if (!node.layoutMode || node.layoutMode === 'NONE') {
    const hChildSize = formatLayoutSizing(node.layoutSizingHorizontal, 'width');
    const vChildSize = formatLayoutSizing(node.layoutSizingVertical, 'height');
    if (hChildSize) lines.push(`- Width: ${hChildSize}`);
    if (vChildSize) lines.push(`- Height: ${vChildSize}`);
  }

  // Self-alignment override in parent's cross-axis
  if (node.layoutAlign && node.layoutAlign !== 'INHERIT') {
    const selfAlignMap: Record<string, string> = {
      STRETCH: 'stretch (fill cross-axis)',
      MIN: 'align-self: flex-start',
      CENTER: 'align-self: center',
      MAX: 'align-self: flex-end',
    };
    lines.push(`- Self alignment: ${selfAlignMap[node.layoutAlign] || node.layoutAlign}`);
  }

  // Absolutely-positioned child inside auto-layout parent
  if (node.layoutPositioning === 'ABSOLUTE') {
    lines.push(
      `\n**Positioning:** absolute (not in flow — use \`position: absolute\` with coordinates)`
    );
  }

  // Overflow clipping
  if (node.clipsContent) {
    lines.push(`\n**Overflow:** hidden`);
  }

  // Scroll/sticky behavior
  if (node.scrollBehavior && node.scrollBehavior !== 'SCROLLS') {
    const behaviorMap: Record<string, string> = {
      FIXED: '`position: fixed`',
      STICKY_SCROLLS: '`position: sticky; top: 0`',
    };
    lines.push(`\n**Scroll behavior:** ${behaviorMap[node.scrollBehavior] || node.scrollBehavior}`);
  }

  // Scrollable container
  if (node.overflowDirection && node.overflowDirection !== 'NONE') {
    const dirMap: Record<string, string> = {
      HORIZONTAL_SCROLLING: '`overflow-x: auto` (horizontal scroll)',
      VERTICAL_SCROLLING: '`overflow-y: auto` (vertical scroll)',
      HORIZONTAL_AND_VERTICAL_SCROLLING: '`overflow: auto` (both axes)',
    };
    lines.push(`\n**Scrollable:** ${dirMap[node.overflowDirection] || node.overflowDirection}`);
  }

  // Responsive size constraints
  const sizeConstraints: string[] = [];
  if (node.minWidth) sizeConstraints.push(`min-width: ${node.minWidth}px`);
  if (node.maxWidth) sizeConstraints.push(`max-width: ${node.maxWidth}px`);
  if (node.minHeight) sizeConstraints.push(`min-height: ${node.minHeight}px`);
  if (node.maxHeight) sizeConstraints.push(`max-height: ${node.maxHeight}px`);
  if (sizeConstraints.length > 0) {
    lines.push(`\n**Size constraints:** ${sizeConstraints.join(', ')}`);
  }

  // Add constraints (only for non-auto-layout contexts — redundant when layoutSizing is present)
  if (node.constraints && (!node.layoutSizingHorizontal || node.layoutPositioning === 'ABSOLUTE')) {
    const hHint = formatConstraintHint(node.constraints.horizontal, 'horizontal');
    const vHint = formatConstraintHint(node.constraints.vertical, 'vertical');
    if (hHint || vHint) {
      lines.push(`\n**Constraints:**`);
      if (hHint) lines.push(`- Horizontal: ${hHint}`);
      if (vHint) lines.push(`- Vertical: ${vHint}`);
    }
  }

  // Add fill colors and gradients (skip IMAGE fills — handled below)
  if (node.fills) {
    const colorFills = node.fills.filter(
      (f) => f.visible !== false && f.type !== 'IMAGE' && f.type !== 'EMOJI' && f.type !== 'VIDEO'
    );
    if (colorFills.length > 0) {
      const fillStr = formatFills(colorFills);
      if (fillStr) lines.push(fillStr);
    }
  }

  // Add strokes (borders)
  if (node.strokes && node.strokes.length > 0) {
    const strokeStr = formatStrokes(node);
    if (strokeStr) lines.push(strokeStr);
  }

  // Add opacity
  if (node.opacity !== undefined && node.opacity < 1) {
    lines.push(`\n**Opacity:** ${node.opacity}`);
  }

  // Add rotation
  if (node.rotation && Math.abs(node.rotation) > 0.1) {
    lines.push(`\n**Rotation:** \`transform: rotate(${Math.round(node.rotation)}deg)\``);
  }

  // Mask indicator
  if (node.isMask) {
    lines.push(`\n**Mask layer** (clips following siblings to this shape)`);
  }

  // Add text content
  if (node.type === 'TEXT' && node.characters) {
    lines.push(`\n**Text content:**`);
    lines.push(`> ${node.characters.replace(/\n/g, '\n> ')}`);

    // Hyperlink
    if (node.style?.hyperlink?.type === 'URL' && node.style.hyperlink.url) {
      lines.push(`- Link: \`${node.style.hyperlink.url}\``);
    }

    if (node.style) {
      lines.push(`\n**Typography:**`);
      lines.push(formatTypography(node.style, options?.fontSubstitutions));
    }
  }

  // Add component properties for variants
  if (node.componentPropertyDefinitions) {
    lines.push(`\n**Component Properties:**`);
    for (const [name, def] of Object.entries(node.componentPropertyDefinitions)) {
      if (def.type === 'VARIANT' && def.variantOptions) {
        lines.push(`- ${name}: ${def.variantOptions.join(' | ')}`);
      } else if (def.type === 'BOOLEAN') {
        lines.push(`- ${name}: boolean (default: ${def.defaultValue})`);
      } else if (def.type === 'TEXT') {
        lines.push(`- ${name}: text (default: "${def.defaultValue}")`);
      } else if (def.type === 'INSTANCE_SWAP') {
        lines.push(`- ${name}: component swap`);
      }
    }
  }

  // Add corner radius
  if (node.cornerRadius && node.cornerRadius > 0) {
    lines.push(`\n**Border radius:** ${node.cornerRadius}px`);
  } else if (node.rectangleCornerRadii) {
    const [tl, tr, br, bl] = node.rectangleCornerRadii;
    if (tl > 0 || tr > 0 || br > 0 || bl > 0) {
      lines.push(`\n**Border radius:** ${tl}px ${tr}px ${br}px ${bl}px`);
    }
  }

  // Add effects summary
  if (node.effects && node.effects.length > 0) {
    const visibleEffects = node.effects.filter((e) => e.visible !== false);
    if (visibleEffects.length > 0) {
      lines.push(`\n**Effects:**`);
      for (const effect of visibleEffects) {
        lines.push(`- ${formatEffect(effect)}`);
      }
    }
  }

  // Add image fill info with CSS implementation hints
  if (node.fills) {
    const imageFills = node.fills.filter(
      (f) => f.type === 'IMAGE' && f.visible !== false && f.imageRef
    );
    if (imageFills.length > 0) {
      // Determine if this is a background image (frame/rectangle with image fill + children)
      const isBackgroundImage = node.children && node.children.length > 0;
      // Detect hero-like sections: large frames (≥ 400px tall) with bg image + child content
      const bbox = node.absoluteBoundingBox;
      const isHeroSection = isBackgroundImage && bbox && bbox.height >= 400 && depth <= 3;
      const imageLabel = isHeroSection
        ? 'Image (Hero Background)'
        : isBackgroundImage
          ? 'Image (Background)'
          : 'Image';
      lines.push(`\n**${imageLabel}:**`);
      for (const fill of imageFills) {
        const dims = node.absoluteBoundingBox;
        const dimStr = dims ? ` (${Math.round(dims.width)}x${Math.round(dims.height)})` : '';
        const hasDownload = options?.imageFillUrls?.[fill.imageRef!];
        const path = hasDownload
          ? `/images/${fill.imageRef}.png`
          : `placehold.co/${dims ? `${Math.round(dims.width)}x${Math.round(dims.height)}` : '400x300'}`;
        lines.push(`- Source: \`${path}\`${dimStr}`);
        lines.push(`- Element: "${node.name}"`);
        if (fill.scaleMode) {
          const cssHint = scaleModeToCSS(fill.scaleMode, isBackgroundImage);
          lines.push(`- Scale mode: ${fill.scaleMode} → CSS: ${cssHint}`);
        }
        // Decode imageTransform to CSS object-position / background-position
        const posHint = fill.imageTransform
          ? imageTransformToObjectPosition(fill.imageTransform)
          : null;
        if (posHint) {
          if (isBackgroundImage) {
            lines.push(`- Crop position: \`background-position: ${posHint}\``);
          } else {
            lines.push(`- Crop position: \`object-position: ${posHint}\``);
          }
        }
        // Image filters → CSS filter()
        if (fill.filters) {
          const cssFilters = imageFiltersToCss(fill.filters);
          if (cssFilters) {
            lines.push(`- Filters: \`filter: ${cssFilters}\``);
          }
        }
        if (isBackgroundImage) {
          const bgPos = posHint || 'center';
          if (isHeroSection) {
            lines.push(
              `- Implementation (HERO): This image MUST fill the entire section. Use \`position: relative\` on the section container with \`min-height: ${dims ? `${Math.round(dims.height)}px` : '100vh'}\`. Apply the image as either:`
            );
            lines.push(
              `  * CSS background: \`background-image: url(${path}); background-size: cover; background-position: ${bgPos}\``
            );
            lines.push(
              `  * Or absolute \`<img>\`: \`position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: ${bgPos}; z-index: 0\``
            );
            lines.push(
              `  * All child content must use \`position: relative; z-index: 1\` to appear above the image`
            );
          } else {
            lines.push(
              `- Implementation: Use CSS \`background-image: url(${path})\` with \`background-size: cover; background-position: ${bgPos}\` on container div, or \`<img>\` with \`object-fit: cover; object-position: ${bgPos}\` as absolute-positioned child behind content`
            );
          }
        }
      }
    }
  }

  // Add exported icon reference (SVG file)
  const iconFile = options?.exportedIcons?.get(node.id);
  if (iconFile) {
    lines.push(`\n**Icon (SVG):**`);
    lines.push(`- Source: \`/images/icons/${iconFile}\``);
    lines.push(`- Element: "${node.name}"`);
    lines.push(
      `- Implementation: Use \`<img src="/images/icons/${iconFile}" alt="${node.name}" />\` or inline SVG`
    );
  }

  lines.push('');

  // Process children (but limit depth for readability)
  if (node.children && depth < 4) {
    // Filter to meaningful children
    const meaningfulChildren = node.children.filter((child) => {
      if (child.visible === false) return false;
      // Include frames, components, groups, text
      if (
        ['FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'GROUP', 'TEXT', 'SECTION'].includes(
          child.type
        )
      ) {
        return true;
      }
      // Include shapes with fills (colors, gradients, images) that are large enough to be meaningful
      if (['RECTANGLE', 'ELLIPSE'].includes(child.type)) {
        const hasFill = child.fills?.some((f) => f.visible !== false) ?? false;
        if (!hasFill) return false;
        // Skip tiny spacer elements
        const bbox = child.absoluteBoundingBox;
        return bbox ? bbox.width >= 20 && bbox.height >= 20 : false;
      }
      // Include VECTOR/BOOLEAN_OPERATION nodes that were exported as icons
      if (['VECTOR', 'BOOLEAN_OPERATION'].includes(child.type)) {
        const bbox = child.absoluteBoundingBox;
        return bbox ? bbox.width >= 8 && bbox.height >= 8 : false;
      }
      return false;
    });

    // Detect overlapping siblings (non-auto-layout) to add z-index hints
    const hasOverlap = !node.layoutMode || node.layoutMode === 'NONE';

    for (let i = 0; i < meaningfulChildren.length; i++) {
      const child = meaningfulChildren[i];
      // In Figma, later children render on top — assign z-index when siblings overlap
      if (hasOverlap && meaningfulChildren.length > 1) {
        lines.push(
          `<!-- z-index: ${i} (layer order: ${i === 0 ? 'back' : i === meaningfulChildren.length - 1 ? 'front' : 'middle'}) -->`
        );
      }
      lines.push(nodeToMarkdown(child, depth + 1, options));
    }
  }

  return lines.join('\n');
}

// ─── Helper functions ───────────────────────────────────────

/**
 * Convert Figma scaleMode to CSS implementation hint
 */
function scaleModeToCSS(scaleMode: string, isBackground?: boolean): string {
  if (isBackground) {
    switch (scaleMode) {
      case 'FILL':
        return '`background-size: cover; background-position: center`';
      case 'FIT':
        return '`background-size: contain; background-repeat: no-repeat; background-position: center`';
      case 'TILE':
        return '`background-repeat: repeat; background-size: auto`';
      case 'STRETCH':
        return '`background-size: 100% 100%`';
      default:
        return `\`background-size: cover\``;
    }
  }
  switch (scaleMode) {
    case 'FILL':
      return '`object-fit: cover`';
    case 'FIT':
      return '`object-fit: contain`';
    case 'STRETCH':
      return '`object-fit: fill`';
    case 'TILE':
      return '`background-repeat: repeat` (use as CSS background)';
    default:
      return '`object-fit: cover`';
  }
}

/**
 * Decode Figma imageTransform (2×3 affine matrix) into CSS object-position.
 *
 * Figma's imageTransform [[a, b, tx], [c, d, ty]] encodes the crop region:
 * - tx, ty = offset of the visible region (0-1 range, relative to image)
 * - a, d  = scale (portion of image visible: 1 = full, 0.5 = 50%)
 *
 * For CSS object-position with object-fit:cover, the percentage tells the
 * browser which part of the image to anchor. We convert the Figma offset
 * and scale into a percentage: position = tx / (1 - a) when a < 1.
 */
function imageTransformToObjectPosition(transform: Transform): string | null {
  const [[a, , tx], [, d, ty]] = transform;
  // If scale is ~1 (no crop), position is irrelevant
  if (a > 0.99 && d > 0.99) return null;

  const xPct = a < 0.99 ? Math.round((tx / (1 - a)) * 100) : 50;
  const yPct = d < 0.99 ? Math.round((ty / (1 - d)) * 100) : 50;

  // Default is 50% 50% — skip if that's what we computed
  if (xPct === 50 && yPct === 50) return null;
  return `${clampPct(xPct)}% ${clampPct(yPct)}%`;
}

function clampPct(v: number): number {
  return Math.max(0, Math.min(100, v));
}

/**
 * Convert Figma RGBA (0-1 range) to hex string
 */
function rgbaToHex(rgba: RGBA): string {
  const r = Math.round(rgba.r * 255);
  const g = Math.round(rgba.g * 255);
  const b = Math.round(rgba.b * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Convert Figma RGBA to CSS rgba() or hex
 */
function rgbaToCss(rgba: RGBA, paintOpacity?: number): string {
  const hex = rgbaToHex(rgba);
  const alpha = (rgba.a ?? 1) * (paintOpacity ?? 1);
  if (alpha < 1) {
    const r = Math.round(rgba.r * 255);
    const g = Math.round(rgba.g * 255);
    const b = Math.round(rgba.b * 255);
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
  }
  return hex;
}

/**
 * Format fills (solid colors and gradients) for display
 */
function formatFills(fills: Paint[]): string {
  const parts: string[] = [];

  for (const fill of fills) {
    if (fill.type === 'SOLID' && fill.color) {
      parts.push(`- Background: ${rgbaToCss(fill.color, fill.opacity)}`);
    } else if (fill.type.startsWith('GRADIENT_') && fill.gradientStops) {
      parts.push(`- Background: ${formatGradient(fill)}`);
    }
  }

  if (parts.length === 0) return '';
  return `\n**Fills:**\n${parts.join('\n')}`;
}

/**
 * Format gradient as CSS gradient string
 */
function formatGradient(paint: Paint): string {
  const stops = paint.gradientStops || [];
  const stopsStr = stops
    .map((s: GradientStop) => `${rgbaToCss(s.color)} ${Math.round(s.position * 100)}%`)
    .join(', ');

  switch (paint.type) {
    case 'GRADIENT_LINEAR':
      return `linear-gradient(${stopsStr})`;
    case 'GRADIENT_RADIAL':
      return `radial-gradient(${stopsStr})`;
    case 'GRADIENT_ANGULAR':
      return `conic-gradient(${stopsStr})`;
    case 'GRADIENT_DIAMOND':
      return `radial-gradient(${stopsStr})`; // CSS has no diamond gradient; approximate as radial
    default:
      return `gradient(${stopsStr})`;
  }
}

/**
 * Format strokes (borders) for display
 */
function formatStrokes(node: FigmaNode): string {
  if (!node.strokes || node.strokes.length === 0) return '';

  const parts: string[] = [];
  for (const stroke of node.strokes) {
    if (stroke.visible === false) continue;
    if (stroke.type === 'SOLID' && stroke.color) {
      const color = rgbaToCss(stroke.color, stroke.opacity);
      const align = node.strokeAlign ? ` (${node.strokeAlign.toLowerCase()})` : '';
      const style = node.strokeDashes?.length ? 'dashed' : 'solid';

      if (node.individualStrokeWeights) {
        const { top, right, bottom, left } = node.individualStrokeWeights;
        if (top > 0) parts.push(`- border-top: ${top}px ${style} ${color}${align}`);
        if (right > 0) parts.push(`- border-right: ${right}px ${style} ${color}${align}`);
        if (bottom > 0) parts.push(`- border-bottom: ${bottom}px ${style} ${color}${align}`);
        if (left > 0) parts.push(`- border-left: ${left}px ${style} ${color}${align}`);
      } else {
        const weight = node.strokeWeight || 1;
        parts.push(`- Border: ${weight}px ${style} ${color}${align}`);
      }
    }
  }

  if (parts.length === 0) return '';
  return `\n**Strokes:**\n${parts.join('\n')}`;
}

/**
 * Format constraint as CSS hint
 */
function formatConstraintHint(constraint: string, axis: 'horizontal' | 'vertical'): string | null {
  const hintMap: Record<string, string> = {
    LEFT: 'fixed left',
    RIGHT: 'fixed right',
    TOP: 'fixed top',
    BOTTOM: 'fixed bottom',
    CENTER: 'centered',
    LEFT_RIGHT: 'fill container width',
    TOP_BOTTOM: 'fill container height',
    SCALE: 'scale with parent',
  };
  const hint = hintMap[constraint];
  // Skip trivial defaults (LEFT for horizontal, TOP for vertical)
  if (axis === 'horizontal' && constraint === 'LEFT') return null;
  if (axis === 'vertical' && constraint === 'TOP') return null;
  return hint || null;
}

/**
 * Format node type for display
 */
function formatNodeType(type: string): string {
  const typeMap: Record<string, string> = {
    FRAME: 'Frame',
    GROUP: 'Group',
    SECTION: 'Section',
    COMPONENT: 'Component',
    COMPONENT_SET: 'Component Set (Variants)',
    INSTANCE: 'Component Instance',
    TEXT: 'Text',
    RECTANGLE: 'Rectangle',
    ELLIPSE: 'Ellipse',
    LINE: 'Line',
    VECTOR: 'Vector',
    CANVAS: 'Page',
    DOCUMENT: 'Document',
  };
  return typeMap[type] || type;
}

/**
 * Format alignment value
 */
function formatAlignment(alignment: string): string {
  const alignMap: Record<string, string> = {
    MIN: 'start',
    CENTER: 'center',
    MAX: 'end',
    SPACE_BETWEEN: 'space-between',
    BASELINE: 'baseline',
  };
  return alignMap[alignment] || alignment.toLowerCase();
}

/**
 * Format layout sizing mode as CSS hint
 */
function formatLayoutSizing(sizing: string | undefined, axis: 'width' | 'height'): string | null {
  if (!sizing) return null;
  switch (sizing) {
    case 'FIXED':
      return null; // Implied by the px dimensions already shown
    case 'HUG':
      return 'fit-content (hug contents)';
    case 'FILL':
      return axis === 'width' ? '100% (fill container)' : 'flex: 1 (fill container)';
    default:
      return null;
  }
}

/**
 * Convert Figma image filters to CSS filter() string
 */
function imageFiltersToCss(filters: ImageFilters): string | null {
  const parts: string[] = [];
  if (filters.exposure && filters.exposure !== 0) {
    parts.push(`brightness(${(1 + filters.exposure / 100).toFixed(2)})`);
  }
  if (filters.contrast && filters.contrast !== 0) {
    parts.push(`contrast(${(1 + filters.contrast / 100).toFixed(2)})`);
  }
  if (filters.saturation && filters.saturation !== 0) {
    parts.push(`saturate(${(1 + filters.saturation / 100).toFixed(2)})`);
  }
  if (filters.temperature && filters.temperature !== 0) {
    // Temperature has no direct CSS equivalent; approximate via hue-rotate
    parts.push(`hue-rotate(${Math.round(filters.temperature * 0.3)}deg)`);
  }
  return parts.length > 0 ? parts.join(' ') : null;
}

/**
 * Format typography info
 */
function formatTypography(style: TypeStyle, fontSubstitutions?: Map<string, string>): string {
  const parts: string[] = [];

  if (style.fontFamily) {
    const substitute = fontSubstitutions?.get(style.fontFamily);
    if (substitute) {
      parts.push(`- Font: ${substitute} (original: ${style.fontFamily})`);
    } else {
      parts.push(`- Font: ${style.fontFamily}`);
    }
  }
  if (style.fontSize) {
    parts.push(`- Size: ${style.fontSize}px`);
  }
  if (style.fontWeight) {
    parts.push(`- Weight: ${style.fontWeight}`);
  }
  if (style.italic || style.fontStyle === 'italic') {
    parts.push(`- Style: italic`);
  }
  if (style.lineHeightPx) {
    parts.push(`- Line height: ${Math.round(style.lineHeightPx)}px`);
  }
  if (style.letterSpacing && style.letterSpacing !== 0) {
    parts.push(`- Letter spacing: ${style.letterSpacing.toFixed(2)}px`);
  }
  if (style.textAlignHorizontal) {
    parts.push(`- Align: ${style.textAlignHorizontal.toLowerCase()}`);
  }
  // Text transform
  if (style.textCase && style.textCase !== 'ORIGINAL') {
    const caseMap: Record<string, string> = {
      UPPER: 'uppercase',
      LOWER: 'lowercase',
      TITLE: 'capitalize',
      SMALL_CAPS: 'small-caps',
      SMALL_CAPS_FORCED: 'small-caps',
    };
    parts.push(`- Text transform: ${caseMap[style.textCase] || style.textCase.toLowerCase()}`);
  }
  // Text decoration
  if (style.textDecoration && style.textDecoration !== 'NONE') {
    parts.push(`- Text decoration: ${style.textDecoration.toLowerCase()}`);
  }
  // Text auto-resize (sizing behavior)
  if (style.textAutoResize && style.textAutoResize !== 'NONE') {
    const resizeMap: Record<string, string> = {
      HEIGHT: 'fixed width, auto height',
      WIDTH_AND_HEIGHT: 'auto width and height (hug contents)',
      TRUNCATE: 'fixed size, truncate overflow',
    };
    parts.push(`- Text sizing: ${resizeMap[style.textAutoResize] || style.textAutoResize}`);
  }
  // Text truncation
  if (style.textTruncation === 'ENDING') {
    if (style.maxLines && style.maxLines > 1) {
      parts.push(
        `- Truncation: ellipsis after ${style.maxLines} lines → \`display: -webkit-box; -webkit-line-clamp: ${style.maxLines}; -webkit-box-orient: vertical; overflow: hidden\``
      );
    } else {
      parts.push(
        `- Truncation: ellipsis → \`text-overflow: ellipsis; overflow: hidden; white-space: nowrap\``
      );
    }
  }

  return parts.join('\n');
}

/**
 * Format effect for display
 */
function formatEffect(effect: {
  type: string;
  radius: number;
  color?: RGBA;
  offset?: { x: number; y: number };
  spread?: number;
  blurType?: string;
}): string {
  const colorStr = effect.color ? ` ${rgbaToCss(effect.color)}` : '';
  switch (effect.type) {
    case 'DROP_SHADOW':
      return `Drop shadow: ${effect.offset?.x || 0}px ${effect.offset?.y || 0}px ${effect.radius}px${effect.spread ? ` spread ${effect.spread}px` : ''}${colorStr}`;
    case 'INNER_SHADOW':
      return `Inner shadow: ${effect.offset?.x || 0}px ${effect.offset?.y || 0}px ${effect.radius}px${colorStr}`;
    case 'LAYER_BLUR':
      return effect.blurType === 'PROGRESSIVE'
        ? `Progressive blur: ${effect.radius}px (approximate with gradient mask + filter: blur())`
        : `Blur: ${effect.radius}px`;
    case 'BACKGROUND_BLUR':
      return `Background blur: ${effect.radius}px → \`backdrop-filter: blur(${effect.radius}px)\``;
    default:
      return effect.type;
  }
}
