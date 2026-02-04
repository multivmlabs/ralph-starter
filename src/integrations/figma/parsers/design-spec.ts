/**
 * Design Spec Parser
 *
 * Converts Figma nodes into markdown design specifications
 * for use as AI coding loop task input.
 */

import type { FigmaNode, TypeStyle } from '../types.js';

/**
 * Convert Figma nodes to a markdown design specification
 */
export function nodesToSpec(nodes: FigmaNode[], fileName: string): string {
  const sections: string[] = [`# Design Specification: ${fileName}\n`];

  for (const node of nodes) {
    // Skip invisible nodes
    if (node.visible === false) continue;

    // Process top-level pages/canvases
    if (node.type === 'CANVAS') {
      sections.push(`## Page: ${node.name}\n`);
      if (node.children) {
        for (const child of node.children) {
          sections.push(nodeToMarkdown(child, 2));
        }
      }
    } else {
      sections.push(nodeToMarkdown(node, 1));
    }
  }

  return sections.join('\n');
}

/**
 * Convert a single Figma node to markdown
 */
function nodeToMarkdown(node: FigmaNode, depth: number): string {
  // Skip invisible nodes
  if (node.visible === false) return '';

  const lines: string[] = [];
  const heading = '#'.repeat(Math.min(depth + 1, 6));

  // Add heading with node name
  lines.push(`${heading} ${node.name}`);

  // Add type badge
  lines.push(`\n*Type: ${formatNodeType(node.type)}*`);

  // Add dimensions if available
  if (node.absoluteBoundingBox) {
    const { width, height } = node.absoluteBoundingBox;
    lines.push(`*Dimensions: ${Math.round(width)} x ${Math.round(height)} px*`);
  }

  // Add description if available (frame descriptions are great for specs)
  if (node.description) {
    lines.push(`\n${node.description}`);
  }

  // Add layout info for auto-layout frames
  if (node.layoutMode && node.layoutMode !== 'NONE') {
    lines.push(`\n**Layout:** ${node.layoutMode.toLowerCase()}`);
    if (node.itemSpacing) {
      lines.push(`- Gap: ${node.itemSpacing}px`);
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

  // Add text content
  if (node.type === 'TEXT' && node.characters) {
    lines.push(`\n**Text content:**`);
    lines.push(`> ${node.characters.replace(/\n/g, '\n> ')}`);

    if (node.style) {
      lines.push(`\n**Typography:**`);
      lines.push(formatTypography(node.style));
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

  lines.push('');

  // Process children (but limit depth for readability)
  if (node.children && depth < 4) {
    // Filter to meaningful children
    const meaningfulChildren = node.children.filter((child) => {
      if (child.visible === false) return false;
      // Include frames, components, groups, text
      return [
        'FRAME',
        'COMPONENT',
        'COMPONENT_SET',
        'INSTANCE',
        'GROUP',
        'TEXT',
        'SECTION',
      ].includes(child.type);
    });

    for (const child of meaningfulChildren) {
      lines.push(nodeToMarkdown(child, depth + 1));
    }
  }

  return lines.join('\n');
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
 * Format typography info
 */
function formatTypography(style: TypeStyle): string {
  const parts: string[] = [];

  if (style.fontFamily) {
    parts.push(`- Font: ${style.fontFamily}`);
  }
  if (style.fontSize) {
    parts.push(`- Size: ${style.fontSize}px`);
  }
  if (style.fontWeight) {
    parts.push(`- Weight: ${style.fontWeight}`);
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

  return parts.join('\n');
}

/**
 * Format effect for display
 */
function formatEffect(effect: {
  type: string;
  radius: number;
  offset?: { x: number; y: number };
}): string {
  switch (effect.type) {
    case 'DROP_SHADOW':
      return `Drop shadow (blur: ${effect.radius}px${effect.offset ? `, offset: ${effect.offset.x}x${effect.offset.y}` : ''})`;
    case 'INNER_SHADOW':
      return `Inner shadow (blur: ${effect.radius}px)`;
    case 'LAYER_BLUR':
      return `Blur (${effect.radius}px)`;
    case 'BACKGROUND_BLUR':
      return `Background blur (${effect.radius}px)`;
    default:
      return effect.type;
  }
}
