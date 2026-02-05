/**
 * Design Tokens Parser
 *
 * Extracts design tokens (colors, typography, spacing, shadows)
 * from Figma files and formats them for various output formats.
 */

import type { Effect, FigmaFile, FigmaNode, Paint, RGBA, TypeStyle } from '../types.js';

export interface DesignTokens {
  colors: Record<string, ColorToken>;
  typography: Record<string, TypographyToken>;
  shadows: Record<string, ShadowToken>;
  radii: Record<string, string>;
  spacing: Record<string, string>;
}

export interface ColorToken {
  value: string;
  hex: string;
  rgba: RGBA;
}

export interface TypographyToken {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  letterSpacing: string;
}

export interface ShadowToken {
  type: 'drop' | 'inner';
  x: string;
  y: string;
  blur: string;
  spread: string;
  color: string;
}

/**
 * Extract design tokens from a Figma file
 */
export function extractTokensFromFile(file: FigmaFile): DesignTokens {
  const tokens: DesignTokens = {
    colors: {},
    typography: {},
    shadows: {},
    radii: {},
    spacing: {},
  };

  // Extract from styles metadata
  if (file.styles) {
    for (const [styleId, styleMeta] of Object.entries(file.styles)) {
      // Find the node that defines this style
      const styleNode = findNodeWithStyle(file.document, styleId);

      if (styleMeta.styleType === 'FILL' && styleNode) {
        const color = extractColorFromNode(styleNode);
        if (color) {
          const name = kebabCase(styleMeta.name);
          tokens.colors[name] = color;
        }
      }

      if (styleMeta.styleType === 'TEXT' && styleNode?.style) {
        const name = kebabCase(styleMeta.name);
        tokens.typography[name] = extractTypographyToken(styleNode.style);
      }

      if (styleMeta.styleType === 'EFFECT' && styleNode) {
        const shadows = extractShadowsFromNode(styleNode);
        for (const [shadowName, shadow] of Object.entries(shadows)) {
          tokens.shadows[`${kebabCase(styleMeta.name)}-${shadowName}`] = shadow;
        }
      }
    }
  }

  // Also traverse document to find additional tokens
  traverseForTokens(file.document, tokens);

  return tokens;
}

/**
 * Find a node that uses a specific style ID
 */
function findNodeWithStyle(node: FigmaNode, styleId: string): FigmaNode | null {
  // Check if this node has the style
  const nodeAny = node as FigmaNode & { styles?: Record<string, string> };
  if (nodeAny.styles) {
    for (const id of Object.values(nodeAny.styles)) {
      if (id === styleId) return node;
    }
  }

  // Recurse through children
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeWithStyle(child, styleId);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Extract color from a node's fills
 */
function extractColorFromNode(node: FigmaNode): ColorToken | null {
  if (!node.fills || node.fills.length === 0) return null;

  const fill = node.fills.find((f) => f.type === 'SOLID' && f.visible !== false);
  if (!fill || !fill.color) return null;

  return rgbaToToken(fill.color, fill.opacity);
}

/**
 * Convert RGBA to color token
 */
function rgbaToToken(rgba: RGBA, opacity?: number): ColorToken {
  const r = Math.round(rgba.r * 255);
  const g = Math.round(rgba.g * 255);
  const b = Math.round(rgba.b * 255);
  const a = opacity !== undefined ? opacity : rgba.a;

  const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

  return {
    value: a < 1 ? `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})` : hex,
    hex,
    rgba: { r: rgba.r, g: rgba.g, b: rgba.b, a },
  };
}

/**
 * Extract typography token from TypeStyle
 */
function extractTypographyToken(style: TypeStyle): TypographyToken {
  return {
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeightPx ? `${Math.round(style.lineHeightPx)}px` : 'normal',
    letterSpacing: style.letterSpacing ? `${style.letterSpacing.toFixed(2)}px` : '0',
  };
}

/**
 * Extract shadow tokens from a node's effects
 */
function extractShadowsFromNode(node: FigmaNode): Record<string, ShadowToken> {
  const shadows: Record<string, ShadowToken> = {};

  if (!node.effects) return shadows;

  let index = 0;
  for (const effect of node.effects) {
    if (effect.visible === false) continue;
    if (effect.type !== 'DROP_SHADOW' && effect.type !== 'INNER_SHADOW') continue;

    const shadow: ShadowToken = {
      type: effect.type === 'DROP_SHADOW' ? 'drop' : 'inner',
      x: `${effect.offset?.x || 0}px`,
      y: `${effect.offset?.y || 0}px`,
      blur: `${effect.radius}px`,
      spread: `${effect.spread || 0}px`,
      color: effect.color ? rgbaToToken(effect.color).value : 'rgba(0, 0, 0, 0.25)',
    };

    shadows[index === 0 ? 'default' : `${index}`] = shadow;
    index++;
  }

  return shadows;
}

/**
 * Traverse document to find additional tokens
 */
function traverseForTokens(node: FigmaNode, tokens: DesignTokens): void {
  // Extract corner radii from frames/rectangles
  if (node.cornerRadius && node.cornerRadius > 0) {
    const name = kebabCase(node.name);
    if (!tokens.radii[name]) {
      tokens.radii[name] = `${node.cornerRadius}px`;
    }
  }

  // Extract spacing from auto-layout frames
  if (node.layoutMode && node.layoutMode !== 'NONE' && node.itemSpacing) {
    const name = kebabCase(node.name);
    if (!tokens.spacing[name]) {
      tokens.spacing[name] = `${node.itemSpacing}px`;
    }
  }

  // Recurse
  if (node.children) {
    for (const child of node.children) {
      traverseForTokens(child, tokens);
    }
  }
}

/**
 * Convert string to kebab-case
 */
function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_/]+/g, '-')
    .replace(/[^\w-]/g, '')
    .toLowerCase();
}

/**
 * Format tokens to various output formats
 */
export function formatTokens(
  tokens: DesignTokens,
  format: 'css' | 'scss' | 'json' | 'tailwind'
): string {
  switch (format) {
    case 'css':
      return formatAsCss(tokens);
    case 'scss':
      return formatAsScss(tokens);
    case 'json':
      return formatAsJson(tokens);
    case 'tailwind':
      return formatAsTailwind(tokens);
    default:
      return formatAsCss(tokens);
  }
}

/**
 * Format as CSS custom properties
 */
function formatAsCss(tokens: DesignTokens): string {
  const lines: string[] = [':root {'];

  // Colors
  if (Object.keys(tokens.colors).length > 0) {
    lines.push('  /* Colors */');
    for (const [name, token] of Object.entries(tokens.colors)) {
      lines.push(`  --color-${name}: ${token.value};`);
    }
    lines.push('');
  }

  // Typography
  if (Object.keys(tokens.typography).length > 0) {
    lines.push('  /* Typography */');
    for (const [name, token] of Object.entries(tokens.typography)) {
      lines.push(`  --font-${name}-family: ${token.fontFamily};`);
      lines.push(`  --font-${name}-size: ${token.fontSize};`);
      lines.push(`  --font-${name}-weight: ${token.fontWeight};`);
      lines.push(`  --font-${name}-line-height: ${token.lineHeight};`);
      lines.push(`  --font-${name}-letter-spacing: ${token.letterSpacing};`);
    }
    lines.push('');
  }

  // Shadows
  if (Object.keys(tokens.shadows).length > 0) {
    lines.push('  /* Shadows */');
    for (const [name, token] of Object.entries(tokens.shadows)) {
      const inset = token.type === 'inner' ? 'inset ' : '';
      lines.push(
        `  --shadow-${name}: ${inset}${token.x} ${token.y} ${token.blur} ${token.spread} ${token.color};`
      );
    }
    lines.push('');
  }

  // Border radii
  if (Object.keys(tokens.radii).length > 0) {
    lines.push('  /* Border Radii */');
    for (const [name, value] of Object.entries(tokens.radii)) {
      lines.push(`  --radius-${name}: ${value};`);
    }
    lines.push('');
  }

  // Spacing
  if (Object.keys(tokens.spacing).length > 0) {
    lines.push('  /* Spacing */');
    for (const [name, value] of Object.entries(tokens.spacing)) {
      lines.push(`  --spacing-${name}: ${value};`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Format as SCSS variables
 */
function formatAsScss(tokens: DesignTokens): string {
  const lines: string[] = ['// Design Tokens extracted from Figma\n'];

  // Colors
  if (Object.keys(tokens.colors).length > 0) {
    lines.push('// Colors');
    for (const [name, token] of Object.entries(tokens.colors)) {
      lines.push(`$color-${name}: ${token.value};`);
    }
    lines.push('');
  }

  // Typography
  if (Object.keys(tokens.typography).length > 0) {
    lines.push('// Typography');
    for (const [name, token] of Object.entries(tokens.typography)) {
      lines.push(`$font-${name}-family: ${token.fontFamily};`);
      lines.push(`$font-${name}-size: ${token.fontSize};`);
      lines.push(`$font-${name}-weight: ${token.fontWeight};`);
      lines.push(`$font-${name}-line-height: ${token.lineHeight};`);
      lines.push(`$font-${name}-letter-spacing: ${token.letterSpacing};`);
    }
    lines.push('');
  }

  // Shadows
  if (Object.keys(tokens.shadows).length > 0) {
    lines.push('// Shadows');
    for (const [name, token] of Object.entries(tokens.shadows)) {
      const inset = token.type === 'inner' ? 'inset ' : '';
      lines.push(
        `$shadow-${name}: ${inset}${token.x} ${token.y} ${token.blur} ${token.spread} ${token.color};`
      );
    }
    lines.push('');
  }

  // Border radii
  if (Object.keys(tokens.radii).length > 0) {
    lines.push('// Border Radii');
    for (const [name, value] of Object.entries(tokens.radii)) {
      lines.push(`$radius-${name}: ${value};`);
    }
    lines.push('');
  }

  // Spacing
  if (Object.keys(tokens.spacing).length > 0) {
    lines.push('// Spacing');
    for (const [name, value] of Object.entries(tokens.spacing)) {
      lines.push(`$spacing-${name}: ${value};`);
    }
  }

  return lines.join('\n');
}

/**
 * Format as JSON
 */
function formatAsJson(tokens: DesignTokens): string {
  return JSON.stringify(tokens, null, 2);
}

/**
 * Format as Tailwind config extend section
 */
function formatAsTailwind(tokens: DesignTokens): string {
  const config: Record<string, Record<string, string>> = {};

  // Colors
  if (Object.keys(tokens.colors).length > 0) {
    config.colors = {};
    for (const [name, token] of Object.entries(tokens.colors)) {
      config.colors[name] = token.value;
    }
  }

  // Font sizes
  if (Object.keys(tokens.typography).length > 0) {
    config.fontSize = {};
    config.fontFamily = {};
    for (const [name, token] of Object.entries(tokens.typography)) {
      config.fontSize[name] = token.fontSize;
      config.fontFamily[name] = token.fontFamily;
    }
  }

  // Border radius
  if (Object.keys(tokens.radii).length > 0) {
    config.borderRadius = {};
    for (const [name, value] of Object.entries(tokens.radii)) {
      config.borderRadius[name] = value;
    }
  }

  // Spacing
  if (Object.keys(tokens.spacing).length > 0) {
    config.spacing = {};
    for (const [name, value] of Object.entries(tokens.spacing)) {
      config.spacing[name] = value;
    }
  }

  // Box shadow
  if (Object.keys(tokens.shadows).length > 0) {
    config.boxShadow = {};
    for (const [name, token] of Object.entries(tokens.shadows)) {
      const inset = token.type === 'inner' ? 'inset ' : '';
      config.boxShadow[name] =
        `${inset}${token.x} ${token.y} ${token.blur} ${token.spread} ${token.color}`;
    }
  }

  const lines = [
    '// tailwind.config.js',
    'module.exports = {',
    '  theme: {',
    '    extend: ' + JSON.stringify(config, null, 6).replace(/\n/g, '\n    '),
    '  }',
    '}',
  ];

  return lines.join('\n');
}
