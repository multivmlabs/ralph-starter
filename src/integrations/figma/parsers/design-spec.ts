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
  /** Composite visual group node IDs that were rendered as single images (nodeId → image path) */
  compositeImages?: Map<string, string>;
  /** Composite node IDs that have text overlays (visual-dominant composites) */
  compositeTextOverlays?: Set<string>;
}

/**
 * Detect composite visual groups — overlapping visual layers that should
 * be rendered as a single image rather than extracted individually.
 *
 * Examples: hero backgrounds made of stacked mountain/gradient layers,
 * photo collages, layered illustrations.
 *
 * IMPORTANT: Composites must be PURE visual groups (shapes, images, gradients).
 * The Figma /images API renders everything visible including text, so if a
 * composite contains text or content frames, the rendered PNG will have
 * baked-in text that conflicts with the text extracted in the spec.
 *
 * Detection criteria:
 * 1. No auto-layout (children overlap intentionally)
 * 2. Multiple children (≥2)
 * 3. ALL children are purely visual — zero TEXT nodes, zero FRAME/GROUP/COMPONENT
 *    children that contain text (these are content containers, not visual layers)
 * 4. Container is large enough to be a background element (≥200px both dimensions)
 * 5. Children actually overlap (bounding box intersection >30%)
 * 6. Not a direct child of CANVAS (those are page sections, not backgrounds)
 */
export interface CompositeNodeResult {
  nodeId: string;
  name: string;
  width: number;
  height: number;
  /** Node IDs of visual-only children to render (excludes text overlays). Present only for visual-dominant composites. */
  visualChildIds?: string[];
  /** Whether this composite has text overlays that should be positioned on top */
  hasTextOverlays?: boolean;
}

export function collectCompositeNodes(nodes: FigmaNode[]): CompositeNodeResult[] {
  const results: CompositeNodeResult[] = [];

  // Collect IDs of top-level frames (direct children of CANVAS) to exclude them
  const topLevelFrameIds = new Set<string>();
  for (const node of nodes) {
    if (node.type === 'CANVAS' && node.children) {
      for (const child of node.children) {
        topLevelFrameIds.add(child.id);
      }
    }
  }

  function walk(node: FigmaNode) {
    if (node.visible === false) return;
    if (!node.children || node.children.length < 2) {
      // Recurse anyway to check deeper nodes
      if (node.children) {
        for (const child of node.children) walk(child);
      }
      return;
    }

    // Never treat top-level frames (page sections) as composites —
    // they contain layout structure the agent needs
    if (topLevelFrameIds.has(node.id)) {
      for (const child of node.children) walk(child);
      return;
    }

    const bbox = node.absoluteBoundingBox;
    // Must be large enough to be a background element (at least 200px in both dimensions)
    if (!bbox || bbox.width < 200 || bbox.height < 200) {
      for (const child of node.children) walk(child);
      return;
    }

    // Must NOT have auto-layout (overlapping is intentional)
    if (node.layoutMode && node.layoutMode !== 'NONE') {
      for (const child of node.children) walk(child);
      return;
    }

    const visibleChildren = node.children.filter((c) => c.visible !== false);
    if (visibleChildren.length < 2) {
      for (const child of node.children) walk(child);
      return;
    }

    // Partition children into visual layers vs text/content layers.
    // Visual layers: image fills, gradients, shapes with NO text descendants.
    // Text layers: TEXT nodes or frames/groups that contain text.
    const visualLayers: FigmaNode[] = [];
    const textLayers: FigmaNode[] = [];

    for (const child of visibleChildren) {
      if (child.type === 'TEXT' || containsText(child)) {
        textLayers.push(child);
      } else if (hasVisualContent(child)) {
        visualLayers.push(child);
      }
    }

    // Need at least 2 visual layers to form a composite
    if (visualLayers.length < 2) {
      for (const child of node.children) walk(child);
      return;
    }

    // Check if visual children overlap
    const visualBboxes = visualLayers
      .map((c) => c.absoluteBoundingBox)
      .filter((b): b is NonNullable<typeof b> => b != null);

    if (visualBboxes.length >= 2 && hasSignificantOverlap(visualBboxes)) {
      if (textLayers.length === 0) {
        // PURE composite: all visual, no text — render entire node as single image
        results.push({
          nodeId: node.id,
          name: node.name,
          width: Math.round(bbox.width),
          height: Math.round(bbox.height),
        });
        // Don't recurse — children are handled as one unit
        return;
      }
      // VISUAL-DOMINANT composite: overlapping visuals WITH text overlays.
      // The text layers must NOT be rendered into the composite image
      // (Figma API bakes text into PNGs, causing duplication).
      // We still record the composite but include visualChildIds so the
      // rendering can target just the visual layers.
      results.push({
        nodeId: node.id,
        name: node.name,
        width: Math.round(bbox.width),
        height: Math.round(bbox.height),
        visualChildIds: visualLayers.map((c) => c.id),
        hasTextOverlays: true,
      });
      // Recurse into text layers so they appear in the spec as normal
      for (const child of textLayers) walk(child);
      return;
    }

    // Recurse into children
    for (const child of node.children) walk(child);
  }

  for (const node of nodes) walk(node);
  return results;
}

/** Check if a node or any of its descendants contain text */
function containsText(node: FigmaNode): boolean {
  if (node.type === 'TEXT') return true;
  if (node.children) {
    for (const child of node.children) {
      if (child.visible !== false && containsText(child)) return true;
    }
  }
  return false;
}

/** Check if a node has visual content (images, fills, or vector shapes) */
function hasVisualContent(node: FigmaNode): boolean {
  // Has image fill
  if (node.fills?.some((f) => f.type === 'IMAGE' && f.visible !== false)) return true;
  // Has meaningful color fill
  if (node.fills?.some((f) => f.visible !== false && f.type === 'SOLID')) return true;
  // Has gradient
  if (node.fills?.some((f) => f.visible !== false && f.type?.startsWith('GRADIENT'))) return true;
  // Is a vector/shape
  if (['VECTOR', 'BOOLEAN_OPERATION', 'RECTANGLE', 'ELLIPSE'].includes(node.type)) return true;
  // Is a group/frame with visual children
  if (node.children?.some((c) => c.visible !== false && hasVisualContent(c))) return true;
  return false;
}

/** Check if bounding boxes have significant overlap (>30% of the smallest box) */
function hasSignificantOverlap(
  boxes: Array<{ x: number; y: number; width: number; height: number }>
): boolean {
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      const overlapX = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
      const overlapY = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
      const overlapArea = overlapX * overlapY;
      const smallerArea = Math.min(a.width * a.height, b.width * b.height);
      if (smallerArea > 0 && overlapArea / smallerArea > 0.3) return true;
    }
  }
  return false;
}

/**
 * Select the primary frame from a list of canvas children.
 *
 * When a Figma page has multiple top-level frames (e.g., "Desktop", "Mobile",
 * component sheets, copies), we only want the main design frame in the spec.
 * Otherwise the agent gets duplicate content and implements everything twice.
 *
 * Heuristic: pick the visible frame with the largest area (width × height).
 * This is almost always the primary design artboard.
 */
export function selectPrimaryFrames(children: FigmaNode[]): FigmaNode[] {
  const visibleFrames = children.filter(
    (c) => c.visible !== false && c.type === 'FRAME' && c.absoluteBoundingBox
  );

  if (visibleFrames.length <= 1) {
    // 0 or 1 frames — return all visible children (may include non-frame nodes)
    return children.filter((c) => c.visible !== false);
  }

  // Pick the frame with the largest area
  let largest = visibleFrames[0];
  let largestArea = 0;
  for (const frame of visibleFrames) {
    const bbox = frame.absoluteBoundingBox!;
    const area = bbox.width * bbox.height;
    if (area > largestArea) {
      largestArea = area;
      largest = frame;
    }
  }

  return [largest];
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
        // Select only the primary frame to avoid spec duplication
        const primaryChildren = selectPrimaryFrames(node.children);
        for (const child of primaryChildren) {
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

  // Infer layout from positions when no auto-layout is present
  if (
    (!node.layoutMode || node.layoutMode === 'NONE') &&
    node.children &&
    node.children.length >= 2
  ) {
    const meaningfulKids = node.children.filter(
      (c) => c.visible !== false && c.absoluteBoundingBox
    );
    const inferred = inferLayout(node, meaningfulKids);
    if (inferred && inferred.type !== 'absolute') {
      lines.push(
        `\n**Inferred Layout** (no auto-layout in Figma — derived from element positions):`
      );
      lines.push(
        `- CSS: \`display: flex; flex-direction: ${inferred.type === 'flex-row' ? 'row' : 'column'}\``
      );
      if (inferred.gap) lines.push(`- Gap: ${inferred.gap}px`);
      if (inferred.padding) {
        const { top, right, bottom, left } = inferred.padding;
        lines.push(`- Padding: ${top}px ${right}px ${bottom}px ${left}px`);
      }
      if (inferred.justify) lines.push(`- Justify: ${inferred.justify}`);
      if (inferred.align) lines.push(`- Align: ${inferred.align}`);
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
        // Classify image semantic importance (people, products, key visuals)
        const sectionBbox = node.absoluteBoundingBox;
        const importance = classifyImageImportance(node.name, dims ?? null, sectionBbox ?? null);
        if (importance) {
          lines.push(
            `- **Responsive Priority: ${importance.priority.toUpperCase()}** — ${importance.hint}`
          );
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

  // Check if this node is a composite visual group (rendered as single image)
  const compositeImagePath = options?.compositeImages?.get(node.id);
  const compositeHasTextOverlays = options?.compositeTextOverlays?.has(node.id);
  if (compositeImagePath) {
    const bbox = node.absoluteBoundingBox;
    const dimStr = bbox ? ` (${Math.round(bbox.width)}x${Math.round(bbox.height)})` : '';

    if (compositeHasTextOverlays) {
      // Visual-dominant composite: visual layers rendered as image, text extracted separately
      lines.push(
        `\n**Composite Background (visual layers only — text NOT included in this image):**`
      );
      lines.push(`- Source: \`${compositeImagePath}\`${dimStr}`);
      lines.push(`- Element: "${node.name}"`);
      lines.push(
        `- This image contains ONLY the visual layers (mountains, gradients, images). Text content appears BELOW as separate elements — overlay them on top.`
      );
      if (bbox && bbox.height >= 400) {
        lines.push(`- Implementation (HERO PARALLAX):`);
        lines.push(
          `  * Container: \`position: relative; overflow: hidden; min-height: ${Math.round(bbox.height)}px\``
        );
        lines.push(
          `  * Background image: \`position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0\``
        );
        lines.push(
          `  * CSS: \`background-image: url(${compositeImagePath}); background-size: cover; background-position: center; min-height: ${Math.round(bbox.height)}px\``
        );
        lines.push(
          `  * ALL text/content below must use \`position: relative; z-index: 1\` to layer OVER the background`
        );
      } else {
        lines.push(
          `- Implementation: Use as full-bleed \`background-image\` with \`background-size: cover\`, all content with \`position: relative; z-index: 1\``
        );
      }

      // Recurse into text/content children (they were NOT rendered into the composite image)
      if (node.children) {
        const textChildren = node.children.filter((child) => {
          if (child.visible === false) return false;
          return child.type === 'TEXT' || containsText(child);
        });
        for (let i = 0; i < textChildren.length; i++) {
          lines.push(nodeToMarkdown(textChildren[i], depth + 1, options));
        }
      }
    } else {
      // Pure composite: all visual, no text children
      lines.push(`\n**Composite Background (rendered as single image):**`);
      lines.push(`- Source: \`${compositeImagePath}\`${dimStr}`);
      lines.push(`- Element: "${node.name}"`);
      lines.push(
        `- This image combines multiple overlapping visual layers from the Figma design into a single background.`
      );
      if (bbox && bbox.height >= 400) {
        lines.push(`- Implementation (HERO): This image MUST fill the entire section.`);
        lines.push(
          `  * CSS: \`background-image: url(${compositeImagePath}); background-size: cover; background-position: center; min-height: ${Math.round(bbox.height)}px\``
        );
        lines.push(
          `  * Or: \`<img src="${compositeImagePath}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0" />\``
        );
        lines.push(`  * All text/content on top must use \`position: relative; z-index: 1\``);
      } else {
        lines.push(
          `- Implementation: Use as \`background-image\` with \`background-size: cover\` or as an \`<img>\` with \`object-fit: cover\``
        );
      }
    }
  } else if (node.children && depth < 6) {
    // Process children (limit depth for readability — deeper levels are more selective)
    const isDeep = depth >= 4;
    const meaningfulChildren = node.children.filter((child) => {
      if (child.visible === false) return false;
      // At deep levels, only include nodes with actual content (text, images, large elements)
      if (isDeep) {
        if (child.type === 'TEXT') return true;
        if (child.fills?.some((f) => f.visible !== false && f.type === 'IMAGE')) return true;
        const bbox = child.absoluteBoundingBox;
        return bbox ? bbox.width >= 50 && bbox.height >= 50 : false;
      }
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

    // Detect sequential/numbered patterns in siblings (e.g., "01", "02", "03" or "Step 1", "Step 2")
    const sequentialPattern = detectSequentialPattern(meaningfulChildren);
    if (sequentialPattern) {
      lines.push(
        `\n**Sequential Pattern Detected (${sequentialPattern.type}):** ${sequentialPattern.description}`
      );
      lines.push(
        `- IMPORTANT: These elements follow an ordered sequence. Preserve the exact layout order and spacing from the design.`
      );
      lines.push(`- Items: ${sequentialPattern.labels.join(' → ')}`);
    }

    for (let i = 0; i < meaningfulChildren.length; i++) {
      const child = meaningfulChildren[i];
      // In overlapping contexts, text/content ALWAYS gets higher z-index than visual layers.
      // This is a universal rule: text must be readable above backgrounds, images, and decorations.
      if (hasOverlap && meaningfulChildren.length > 1) {
        const isTextContent = child.type === 'TEXT' || containsText(child);
        if (isTextContent) {
          lines.push(
            `<!-- z-index: 10 (text/content layer — MUST be above all visual layers: use position: relative; z-index: 10) -->`
          );
        } else {
          const isImage = child.fills?.some((f) => f.visible !== false && f.type === 'IMAGE');
          lines.push(
            `<!-- z-index: ${i} (${isImage ? 'image' : 'visual'} layer: ${i === 0 ? 'back' : 'middle'} — behind text content) -->`
          );
        }
      }
      lines.push(nodeToMarkdown(child, depth + 1, options));
    }
  }

  return lines.join('\n');
}

// ─── Sequential Pattern Detection ───────────────────────────

interface SequentialPatternResult {
  type: string;
  description: string;
  labels: string[];
}

/**
 * Detect sequential/numbered patterns among sibling elements.
 *
 * Designs often use numbered steps (01, 02, 03), ordered lists, or
 * sequential labels. The agent must preserve the exact order and
 * spacing from the design, not reflow them arbitrarily.
 */
function detectSequentialPattern(children: FigmaNode[]): SequentialPatternResult | null {
  if (children.length < 2) return null;

  // Strategy 1: Check node names for numeric sequences ("01", "02" or "Step 1", "Step 2")
  const nameNums: { index: number; num: number; label: string }[] = [];
  for (let i = 0; i < children.length; i++) {
    const match = children[i].name.match(/(\d+)/);
    if (match) {
      nameNums.push({ index: i, num: parseInt(match[1], 10), label: children[i].name });
    }
  }

  if (nameNums.length >= 2) {
    const sorted = [...nameNums].sort((a, b) => a.num - b.num);
    const isSequential = sorted.every((item, i) => i === 0 || item.num === sorted[i - 1].num + 1);
    if (isSequential) {
      return {
        type: 'numbered-steps',
        description: `${sorted.length} ordered items (${sorted[0].num}–${sorted[sorted.length - 1].num})`,
        labels: sorted.map((s) => s.label),
      };
    }
  }

  // Strategy 2: Check first TEXT child for leading numbers ("01 ...", "1. ...")
  const textNums: { index: number; num: number; label: string }[] = [];
  for (let i = 0; i < children.length; i++) {
    const firstText = findFirstTextContent(children[i]);
    if (firstText) {
      const match = firstText.match(/^[0\s]*(\d+)/);
      if (match) {
        const preview = firstText.slice(0, 40).replace(/\n/g, ' ');
        textNums.push({ index: i, num: parseInt(match[1], 10), label: preview });
      }
    }
  }

  if (textNums.length >= 2) {
    const sorted = [...textNums].sort((a, b) => a.num - b.num);
    const isSequential = sorted.every((item, i) => i === 0 || item.num === sorted[i - 1].num + 1);
    if (isSequential) {
      return {
        type: 'numbered-content',
        description: `${sorted.length} sequentially numbered content blocks`,
        labels: sorted.map((s) => s.label),
      };
    }
  }

  return null;
}

/** Find the first text content string in a node tree (shallow search, max depth 3) */
function findFirstTextContent(node: FigmaNode, depth = 0): string | null {
  if (depth > 3) return null;
  if (node.type === 'TEXT' && node.characters) return node.characters;
  if (node.children) {
    for (const child of node.children) {
      if (child.visible === false) continue;
      const text = findFirstTextContent(child, depth + 1);
      if (text) return text;
    }
  }
  return null;
}

// ─── Image Semantic Importance ──────────────────────────────

interface ImageImportance {
  priority: 'critical' | 'high' | 'normal';
  hint: string;
}

/**
 * Classify image semantic importance from node name and context.
 *
 * Universal heuristic: images of people are almost always the most
 * important visual element on a page (hero portraits, team photos,
 * testimonials). They must never be hidden or cropped away at any
 * breakpoint. Product/feature images are also high-priority.
 */
function classifyImageImportance(
  nodeName: string,
  bbox: { width: number; height: number } | null,
  sectionBbox: { width: number; height: number } | null
): ImageImportance | null {
  const lower = nodeName.toLowerCase();

  // Person/people images — highest priority
  if (
    /\b(person|people|portrait|photo|avatar|team|founder|headshot|profile|model|woman|man|face|selfie|human|client|testimonial)\b/.test(
      lower
    ) ||
    /\b(hero.*(image|photo|pic|img))\b/.test(lower)
  ) {
    return {
      priority: 'critical',
      hint: 'Contains a person/people — this is the KEY visual element. MUST remain visible at ALL viewport sizes. Use `object-position: top center` to keep the face/upper body visible when cropping. NEVER use `display: none` or `visibility: hidden` on this image at any breakpoint.',
    };
  }

  // Large images relative to section — likely the primary visual
  if (bbox && sectionBbox) {
    const areaRatio = (bbox.width * bbox.height) / (sectionBbox.width * sectionBbox.height);
    if (areaRatio > 0.3) {
      return {
        priority: 'high',
        hint: 'Large primary image — keep visible at all breakpoints. On smaller screens, scale proportionally rather than hiding.',
      };
    }
  }

  // Product/key content images
  if (
    /\b(product|feature|showcase|main|key|primary|highlight|mockup|screenshot|demo)\b/.test(lower)
  ) {
    return {
      priority: 'high',
      hint: 'Key content image — must remain visible and prominent at all breakpoints.',
    };
  }

  return null;
}

// ─── Layout Inference ───────────────────────────────────────

interface InferredLayout {
  type: 'flex-row' | 'flex-column' | 'absolute';
  gap?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  justify?: string;
  align?: string;
}

/**
 * Infer CSS layout from absolute positions of sibling elements.
 * Used when Figma designs lack auto-layout (e.g., community files).
 */
function inferLayout(parent: FigmaNode, children: FigmaNode[]): InferredLayout | null {
  if (children.length < 2) return null;
  if (parent.layoutMode && parent.layoutMode !== 'NONE') return null;

  const parentBbox = parent.absoluteBoundingBox;
  if (!parentBbox) return null;

  const childBoxes = children
    .filter((c) => c.absoluteBoundingBox)
    .map((c) => {
      const bb = c.absoluteBoundingBox as NonNullable<typeof c.absoluteBoundingBox>;
      return {
        node: c,
        bbox: bb,
        relX: bb.x - parentBbox.x,
        relY: bb.y - parentBbox.y,
      };
    });

  if (childBoxes.length < 2) return null;

  // Check for horizontal row: all children share similar Y within tolerance
  const yTolerance = Math.min(20, parentBbox.height * 0.05);
  const yValues = childBoxes.map((c) => c.relY);
  const yRange = Math.max(...yValues) - Math.min(...yValues);
  const isHorizontalRow = yRange < yTolerance;

  // Check for vertical column: all children share similar X within tolerance
  const xTolerance = Math.min(20, parentBbox.width * 0.05);
  const xValues = childBoxes.map((c) => c.relX);
  const xRange = Math.max(...xValues) - Math.min(...xValues);
  const isVerticalColumn = xRange < xTolerance;

  if (isHorizontalRow && childBoxes.length >= 2) {
    const sorted = [...childBoxes].sort((a, b) => a.relX - b.relX);
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prevRight = sorted[i - 1].relX + sorted[i - 1].bbox.width;
      gaps.push(Math.round(sorted[i].relX - prevRight));
    }
    const avgGap = gaps.length > 0 ? Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length) : 0;

    const firstLeft = sorted[0].relX;
    const lastRight = sorted[sorted.length - 1].relX + sorted[sorted.length - 1].bbox.width;
    const topPad = Math.round(Math.max(0, Math.min(...yValues)));
    const leftPad = Math.round(Math.max(0, firstLeft));
    const rightPad = Math.round(Math.max(0, parentBbox.width - lastRight));

    return {
      type: 'flex-row',
      gap: avgGap > 0 ? avgGap : undefined,
      padding:
        topPad > 0 || leftPad > 0 || rightPad > 0
          ? { top: topPad, right: rightPad, bottom: 0, left: leftPad }
          : undefined,
      justify: detectJustification(
        sorted.map((s) => s.relX),
        sorted.map((s) => s.bbox.width),
        parentBbox.width
      ),
    };
  }

  if (isVerticalColumn && childBoxes.length >= 2) {
    const sorted = [...childBoxes].sort((a, b) => a.relY - b.relY);
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prevBottom = sorted[i - 1].relY + sorted[i - 1].bbox.height;
      gaps.push(Math.round(sorted[i].relY - prevBottom));
    }
    const avgGap = gaps.length > 0 ? Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length) : 0;

    const topPad = Math.round(Math.max(0, sorted[0].relY));
    const leftPad = Math.round(Math.max(0, Math.min(...xValues)));

    return {
      type: 'flex-column',
      gap: avgGap > 0 ? avgGap : undefined,
      padding:
        topPad > 0 || leftPad > 0 ? { top: topPad, right: 0, bottom: 0, left: leftPad } : undefined,
    };
  }

  // Neither row nor column — elements may overlap or have complex positions
  return { type: 'absolute' };
}

/**
 * Detect justification (start, center, space-between, end) from child X positions.
 */
function detectJustification(
  xs: number[],
  widths: number[],
  parentWidth: number
): string | undefined {
  if (xs.length < 2) return undefined;

  const firstLeft = xs[0];
  const lastRight = xs[xs.length - 1] + widths[widths.length - 1];
  const leftSpace = firstLeft;
  const rightSpace = parentWidth - lastRight;

  // Nearly equal left/right space → center
  if (Math.abs(leftSpace - rightSpace) < 20 && leftSpace > 20) {
    return 'center';
  }

  // Very little left space, substantial right space → flex-start
  if (leftSpace < 20 && rightSpace > 40) {
    return 'flex-start';
  }

  // Very little right space, substantial left space → flex-end
  if (rightSpace < 20 && leftSpace > 40) {
    return 'flex-end';
  }

  // Equal gaps between items → space-between (if outer edges have minimal spacing)
  if (xs.length >= 3) {
    const gaps: number[] = [];
    for (let i = 1; i < xs.length; i++) {
      gaps.push(xs[i] - (xs[i - 1] + widths[i - 1]));
    }
    const gapVariance = Math.max(...gaps) - Math.min(...gaps);
    if (gapVariance < 10 && leftSpace < gaps[0] * 0.5) {
      return 'space-between';
    }
  }

  return undefined;
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
export function rgbaToCss(rgba: RGBA, paintOpacity?: number): string {
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
export function formatGradient(paint: Paint): string {
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
