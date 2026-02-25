/**
 * Sanitization utilities for filesystem and network operations.
 * Prevents path traversal, SSRF, and XSS when writing untrusted data to disk.
 */

/**
 * Sanitize a filename to prevent path traversal and filesystem issues.
 * Strips directory separators, null bytes, and non-alphanumeric characters
 * except dashes, dots, and underscores.
 */
export function sanitizeAssetFilename(input: string): string {
  return input
    .replace(/\0/g, '') // Strip null bytes
    .replace(/[/\\]/g, '') // Strip directory separators
    .replace(/\.\./g, '') // Strip path traversal
    .replace(/[^a-zA-Z0-9._-]/g, '-') // Replace unsafe chars
    .replace(/-+/g, '-') // Collapse multiple dashes
    .replace(/^\.+/, '') // Strip leading dots (hidden files)
    .slice(0, 255); // Filesystem filename length limit
}

/**
 * Validate that a URL points to an expected Figma CDN domain.
 * Prevents SSRF if the API returned a malicious URL.
 */
export function isValidFigmaCdnUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname.endsWith('.figma.com') ||
        parsed.hostname.endsWith('.amazonaws.com') ||
        parsed.hostname.endsWith('.cloudfront.net'))
    );
  } catch {
    return false;
  }
}

/**
 * Sanitize SVG content to remove script elements, event handlers,
 * and other potentially dangerous content.
 *
 * Uses iterative stripping to handle nested/obfuscated patterns.
 */
export function sanitizeSvgContent(svg: string): string {
  let clean = svg;

  // Iteratively strip <script> tags (handles nested/malformed cases)
  let prev = '';
  while (prev !== clean) {
    prev = clean;
    clean = clean.replace(/<script[\s>][\s\S]*?<\/script[\s>]*>/gi, '');
    clean = clean.replace(/<script[\s/][^>]*>/gi, '');
  }

  // Strip event handler attributes (on*="..." and on*='...')
  // Iterative to handle cases where removal reveals new matches
  prev = '';
  while (prev !== clean) {
    prev = clean;
    clean = clean.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '');
    clean = clean.replace(/\s+on\w+\s*=\s*'[^']*'/gi, '');
    clean = clean.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');
  }

  // Strip javascript: and data: URIs in href/xlink:href/src attributes
  clean = clean.replace(/(href|src)\s*=\s*["']?\s*javascript\s*:/gi, '$1="');
  clean = clean.replace(/(href|src)\s*=\s*["']?\s*data\s*:\s*text\/html/gi, '$1="');

  return clean;
}

/** PNG file signature (first 8 bytes). */
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Validate that a buffer starts with the PNG magic bytes.
 * Prevents writing non-image payloads fetched from the network.
 */
export function isValidPngBuffer(buf: Buffer): boolean {
  return buf.length >= 8 && buf.subarray(0, 8).equals(PNG_MAGIC);
}
