/**
 * Font Checker
 *
 * Detects fonts used in Figma designs and checks availability on Google Fonts.
 * Suggests substitutions for commercial/proprietary fonts.
 */

import { FONT_SUBSTITUTIONS, GOOGLE_FONTS } from '../data/google-fonts.js';
import type { FigmaNode } from '../types.js';

export interface FontCheckResult {
  fontFamily: string;
  isGoogleFont: boolean;
  suggestedAlternative?: string;
}

/**
 * Collect all unique font families from a Figma node tree
 */
export function collectFontFamilies(nodes: FigmaNode[]): Set<string> {
  const fonts = new Set<string>();

  function walk(node: FigmaNode) {
    if (node.type === 'TEXT' && node.style?.fontFamily) {
      fonts.add(node.style.fontFamily);
    }
    // Check style override table for mixed-style text nodes
    if (node.styleOverrideTable) {
      for (const override of Object.values(node.styleOverrideTable)) {
        if (override.fontFamily) fonts.add(override.fontFamily);
      }
    }
    if (node.children) {
      for (const child of node.children) walk(child);
    }
  }

  for (const node of nodes) walk(node);
  return fonts;
}

/**
 * Check each font against Google Fonts and find substitutions
 */
export function checkFonts(fontFamilies: Set<string>): FontCheckResult[] {
  const results: FontCheckResult[] = [];
  for (const font of fontFamilies) {
    const isGoogle = GOOGLE_FONTS.has(font);
    const result: FontCheckResult = { fontFamily: font, isGoogleFont: isGoogle };
    if (!isGoogle) {
      result.suggestedAlternative = findSubstitution(font) ?? undefined;
    }
    results.push(result);
  }
  return results;
}

/**
 * Find a Google Fonts substitute for a proprietary font
 */
function findSubstitution(fontFamily: string): string | null {
  // Direct match
  if (FONT_SUBSTITUTIONS.has(fontFamily)) {
    return FONT_SUBSTITUTIONS.get(fontFamily)!;
  }

  // Strip weight/style suffixes and try again
  const normalized = fontFamily
    .replace(
      /\s*(Regular|Bold|Light|Medium|Thin|Black|Heavy|Book|Demi|Semi|SemiBold|ExtraBold|ExtraLight|UltraLight|Italic)\s*/gi,
      ' '
    )
    .trim();
  if (normalized !== fontFamily && FONT_SUBSTITUTIONS.has(normalized)) {
    return FONT_SUBSTITUTIONS.get(normalized)!;
  }

  return null;
}

/**
 * Build markdown section describing font substitutions for the spec
 */
export function buildFontSubstitutionMarkdown(fontChecks: FontCheckResult[]): string {
  const nonGoogle = fontChecks.filter((f) => !f.isGoogleFont);
  if (nonGoogle.length === 0) return '';

  const lines: string[] = ['## Font Substitutions\n'];
  lines.push(
    'The following fonts from the Figma design are not available on Google Fonts and have been substituted:\n'
  );
  lines.push('| Original Font | Substitute (Google Fonts) |');
  lines.push('|--------------|--------------------------|');
  for (const font of nonGoogle) {
    lines.push(
      `| ${font.fontFamily} | ${font.suggestedAlternative || '*(pick a similar Google Font)*'} |`
    );
  }
  lines.push(
    '\nUse the substitute fonts in your implementation. Import them via Google Fonts `<link>` tag.\n'
  );
  return lines.join('\n');
}
