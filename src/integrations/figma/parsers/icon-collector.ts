/**
 * Icon Collector
 *
 * Detects icon-like nodes in a Figma node tree — small VECTOR, INSTANCE, or FRAME
 * nodes that are likely icons (typically ≤ 48px). These get exported as SVG via the
 * Figma Images API so the coding agent can use them directly.
 */

import type { FigmaNode } from '../types.js';

export interface IconInfo {
  nodeId: string;
  nodeName: string;
  width: number;
  height: number;
  /** Sanitized filename for saving the SVG */
  filename: string;
}

/** Max dimension (px) to consider a node an icon */
const MAX_ICON_SIZE = 64;
/** Min dimension (px) to avoid collecting spacers or separators */
const MIN_ICON_SIZE = 8;

/**
 * Collect icon-like nodes from the tree.
 * Icons are small VECTOR/BOOLEAN_OPERATION/INSTANCE/FRAME nodes (≤ 64px).
 * Deduplicates by name (same icon used multiple times → export once).
 */
export function collectIconNodes(nodes: FigmaNode[], limit = 30): IconInfo[] {
  const results: IconInfo[] = [];
  const seenNames = new Set<string>();

  function walk(node: FigmaNode) {
    if (node.visible === false) return;

    const bbox = node.absoluteBoundingBox;
    if (bbox && isIconNode(node, bbox.width, bbox.height)) {
      const name = sanitizeIconName(node.name);
      if (!seenNames.has(name)) {
        seenNames.add(name);
        results.push({
          nodeId: node.id,
          nodeName: node.name,
          width: Math.round(bbox.width),
          height: Math.round(bbox.height),
          filename: `${name}.svg`,
        });
        if (results.length >= limit) return;
      }
    }

    if (node.children) {
      for (const child of node.children) {
        if (results.length >= limit) return;
        walk(child);
      }
    }
  }

  for (const node of nodes) {
    if (results.length >= limit) break;
    walk(node);
  }
  return results;
}

/**
 * Determine if a node looks like an icon based on type, size, and name heuristics.
 */
function isIconNode(node: FigmaNode, width: number, height: number): boolean {
  // Must be within icon size range
  if (width < MIN_ICON_SIZE || height < MIN_ICON_SIZE) return false;
  if (width > MAX_ICON_SIZE || height > MAX_ICON_SIZE) return false;

  // VECTOR and BOOLEAN_OPERATION are almost always icons or icon parts
  if (node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION') return true;

  // Small INSTANCE nodes are typically icon component instances
  if (node.type === 'INSTANCE') return true;

  // Small FRAME/GROUP nodes named with icon-like patterns
  if (node.type === 'FRAME' || node.type === 'GROUP') {
    const nameLower = node.name.toLowerCase();
    if (
      nameLower.includes('icon') ||
      nameLower.includes('logo') ||
      nameLower.includes('arrow') ||
      nameLower.includes('chevron') ||
      nameLower.includes('close') ||
      nameLower.includes('menu') ||
      nameLower.includes('search') ||
      nameLower.includes('cart') ||
      nameLower.includes('account') ||
      nameLower.includes('user') ||
      nameLower.includes('check') ||
      nameLower.includes('star') ||
      nameLower.includes('heart') ||
      nameLower.includes('social')
    ) {
      return true;
    }
    // Small frames with vector children are likely icons
    if (node.children?.some((c) => c.type === 'VECTOR' || c.type === 'BOOLEAN_OPERATION')) {
      return true;
    }
  }

  return false;
}

/**
 * Sanitize a Figma node name into a valid filename.
 */
function sanitizeIconName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'icon'
  );
}
