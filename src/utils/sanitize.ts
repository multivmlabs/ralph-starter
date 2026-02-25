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
 * Sanitize SVG content to remove script elements and event handlers.
 */
export function sanitizeSvgContent(svg: string): string {
  let clean = svg.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/\s+on\w+="[^"]*"/gi, '');
  clean = clean.replace(/\s+on\w+='[^']*'/gi, '');
  return clean;
}
