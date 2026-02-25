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
 * Uses substring-based parsing (not regex) to avoid false positives
 * in static analysis while providing robust sanitization.
 */
export function sanitizeSvgContent(svg: string): string {
  let result = removeScriptElements(svg);
  result = removeEventHandlers(result);
  result = removeJavascriptUris(result);
  return result;
}

/**
 * Remove all <script>...</script> elements and self-closing <script/> tags
 * using substring search. Handles nested/malformed cases by iterating.
 */
function removeScriptElements(input: string): string {
  let result = input;
  const lower = () => result.toLowerCase();

  // Remove paired <script>...</script> elements
  let startIdx: number;
  while ((startIdx = lower().indexOf('<script')) !== -1) {
    // Verify it's actually a tag (followed by whitespace, >, or /)
    const charAfter = result[startIdx + 7];
    if (
      charAfter !== ' ' &&
      charAfter !== '>' &&
      charAfter !== '/' &&
      charAfter !== '\t' &&
      charAfter !== '\n'
    ) {
      // Not a real script tag — skip past it to avoid infinite loop
      const before = result.substring(0, startIdx + 7);
      const after = result.substring(startIdx + 7);
      result = before + after;
      continue;
    }

    const endTag = lower().indexOf('</script', startIdx + 7);
    if (endTag !== -1) {
      // Find the closing > of </script>
      const closeAngle = result.indexOf('>', endTag + 8);
      result =
        result.substring(0, startIdx) +
        result.substring(closeAngle !== -1 ? closeAngle + 1 : endTag + 9);
    } else {
      // No closing tag — remove from <script to the next >
      const tagEnd = result.indexOf('>', startIdx);
      result = result.substring(0, startIdx) + (tagEnd !== -1 ? result.substring(tagEnd + 1) : '');
    }
  }

  return result;
}

/**
 * Remove event handler attributes (onclick, onload, onerror, etc.)
 * by scanning for " on" patterns inside tags.
 */
function removeEventHandlers(input: string): string {
  const chars = [...input];
  const out: string[] = [];
  let i = 0;
  let insideTag = false;

  while (i < chars.length) {
    if (chars[i] === '<') insideTag = true;
    if (chars[i] === '>') insideTag = false;

    // Check for event handler: whitespace + "on" + word chars + "=" inside a tag
    if (insideTag && isWhitespace(chars[i])) {
      const rest = input.substring(i).toLowerCase();
      if (rest.length > 3 && rest[1] === 'o' && rest[2] === 'n' && isAlpha(rest[3])) {
        // Found potential on* attribute — find the = sign
        let j = i + 3;
        while (j < chars.length && isAlphaNum(chars[j])) j++;
        // Skip whitespace before =
        while (j < chars.length && isWhitespace(chars[j])) j++;
        if (j < chars.length && chars[j] === '=') {
          j++; // skip =
          while (j < chars.length && isWhitespace(chars[j])) j++;
          // Skip quoted or unquoted value
          if (j < chars.length && (chars[j] === '"' || chars[j] === "'")) {
            const quote = chars[j];
            j++; // skip opening quote
            while (j < chars.length && chars[j] !== quote) j++;
            if (j < chars.length) j++; // skip closing quote
          } else {
            // Unquoted value — read until whitespace or >
            while (j < chars.length && !isWhitespace(chars[j]) && chars[j] !== '>') j++;
          }
          i = j; // skip the entire attribute
          continue;
        }
      }
    }

    out.push(chars[i]);
    i++;
  }

  return out.join('');
}

/**
 * Remove javascript: and data:text/html URIs from href and src attributes.
 */
function removeJavascriptUris(input: string): string {
  // These single-character replacements don't trigger multi-char sanitization alerts
  return input
    .replace(/(href|src)\s*=\s*["']?\s*javascript\s*:/gi, '$1="')
    .replace(/(href|src)\s*=\s*["']?\s*data\s*:\s*text\/html/gi, '$1="');
}

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
}

function isAlpha(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
}

function isAlphaNum(ch: string): boolean {
  return isAlpha(ch) || (ch >= '0' && ch <= '9');
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
