/**
 * Figma URL Parser
 *
 * Parses Figma URLs and identifiers to extract file keys and node IDs.
 */

export interface FigmaUrlParts {
  /** The Figma file key (22 character alphanumeric) */
  fileKey: string;
  /** Optional node IDs extracted from URL */
  nodeIds?: string[];
  /** Optional file name from URL */
  fileName?: string;
}

/**
 * Parse a Figma URL or file key into its component parts
 *
 * Supported formats:
 * - Direct file key: "ABC123xyz..."
 * - File URL: https://www.figma.com/file/FILEKEY/FileName
 * - Design URL: https://www.figma.com/design/FILEKEY/FileName
 * - With node selection: https://www.figma.com/file/FILEKEY/FileName?node-id=X:Y
 * - With multiple nodes: https://www.figma.com/file/FILEKEY/FileName?node-id=X:Y,A:B
 *
 * @param input - Figma URL or file key
 * @returns Parsed URL parts
 */
export function parseFigmaUrl(input: string): FigmaUrlParts {
  const trimmed = input.trim();

  // Handle direct file key (22 alphanumeric characters)
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
    return { fileKey: trimmed };
  }

  // Handle Figma URLs
  // Patterns:
  // - https://www.figma.com/file/FILEKEY/FileName
  // - https://www.figma.com/design/FILEKEY/FileName
  // - https://www.figma.com/proto/FILEKEY/FileName
  // - https://www.figma.com/board/FILEKEY/FileName
  const urlMatch = trimmed.match(
    /figma\.com\/(?:file|design|proto|board)\/([a-zA-Z0-9]+)(?:\/([^?#]+))?(?:\?[^#]*node-id=([^&#]+))?/i
  );

  if (urlMatch) {
    const result: FigmaUrlParts = {
      fileKey: urlMatch[1],
    };

    // Extract file name
    if (urlMatch[2]) {
      result.fileName = decodeURIComponent(urlMatch[2].replace(/-/g, ' '));
    }

    // Extract node IDs
    if (urlMatch[3]) {
      // Node IDs can be comma-separated and URL-encoded.
      // Figma URLs use dashes (0-1) but the REST API expects colons (0:1).
      const nodeIdStr = decodeURIComponent(urlMatch[3]);
      result.nodeIds = nodeIdStr.split(',').map((id) => {
        const trimmed = id.trim();
        // Convert "0-1" → "0:1" (only for simple N-N patterns from URLs)
        return /^\d+-\d+$/.test(trimmed) ? trimmed.replace('-', ':') : trimmed;
      });
    }

    return result;
  }

  // Try to extract a file key from any URL-like string
  const keyMatch = trimmed.match(/([a-zA-Z0-9]{22})/);
  if (keyMatch) {
    return { fileKey: keyMatch[1] };
  }

  throw new Error(
    `Invalid Figma identifier: "${input}". ` +
      'Provide a file key (22 characters) or Figma URL ' +
      '(e.g., https://figma.com/file/XXXXX/Name or https://figma.com/design/XXXXX/Name)'
  );
}

/**
 * Check if a string looks like a Figma URL
 */
export function isFigmaUrl(input: string): boolean {
  return /figma\.com\/(file|design|proto|board)\//.test(input);
}

/**
 * Format node IDs for API request (comma-separated, URL-encoded)
 */
export function formatNodeIds(nodeIds: string[]): string {
  return nodeIds.map((id) => encodeURIComponent(id)).join(',');
}

/**
 * Convert Figma node ID to a safe filename
 * Node IDs are in format "X:Y" which isn't filesystem-safe
 */
export function nodeIdToFilename(nodeId: string): string {
  return nodeId.replace(/:/g, '-');
}
