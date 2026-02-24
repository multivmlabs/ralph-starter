/**
 * Image Collector
 *
 * Detects nodes with IMAGE fills in a Figma node tree and collects
 * their imageRef values for downloading.
 */

import type { FigmaNode } from '../types.js';

export interface ImageRefInfo {
  imageRef: string;
  nodeId: string;
  nodeName: string;
  width: number;
  height: number;
}

/**
 * Collect all image references from nodes with IMAGE paint fills
 */
export function collectImageRefs(nodes: FigmaNode[]): ImageRefInfo[] {
  const results: ImageRefInfo[] = [];
  const seen = new Set<string>();

  function walk(node: FigmaNode) {
    if (node.fills) {
      for (const fill of node.fills) {
        if (
          fill.type === 'IMAGE' &&
          fill.visible !== false &&
          fill.imageRef &&
          !seen.has(fill.imageRef)
        ) {
          seen.add(fill.imageRef);
          const bbox = node.absoluteBoundingBox;
          results.push({
            imageRef: fill.imageRef,
            nodeId: node.id,
            nodeName: node.name,
            width: bbox ? Math.round(bbox.width) : 0,
            height: bbox ? Math.round(bbox.height) : 0,
          });
        }
      }
    }
    if (node.children) {
      for (const child of node.children) walk(child);
    }
  }

  for (const node of nodes) walk(node);
  return results;
}
