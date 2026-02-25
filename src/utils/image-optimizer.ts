/**
 * Image Optimizer
 *
 * Compresses and resizes downloaded Figma images to reduce file sizes.
 * Uses `sharp` as an optional dependency — gracefully degrades when unavailable.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const MAX_IMAGE_BYTES = 1_000_000; // 1MB target
const MAX_IMAGE_DIMENSION = 2048; // Max width or height in pixels

/**
 * Optimize a single image file: resize if dimensions exceed max, compress PNG.
 * Only processes files larger than 1MB.
 *
 * @returns Info about what was done (or skipped)
 */
export async function optimizeImage(
  filePath: string,
  targetMaxBytes: number = MAX_IMAGE_BYTES
): Promise<{ optimized: boolean; originalSize: number; newSize: number }> {
  // Read file into memory once to avoid TOCTOU race between stat and read
  let fileBuffer: Buffer;
  try {
    fileBuffer = readFileSync(filePath);
  } catch {
    return { optimized: false, originalSize: 0, newSize: 0 };
  }
  const originalSize = fileBuffer.length;

  // Skip if already under target
  if (originalSize <= targetMaxBytes) {
    return { optimized: false, originalSize, newSize: originalSize };
  }

  try {
    // Dynamic import — sharp is an optional dependency.
    // Using Function constructor to prevent TypeScript from resolving the module at compile time.
    // biome-ignore lint/security/noGlobalEval: dynamic optional dependency import
    const sharpModule = (await new Function('return import("sharp")')().catch(() => null)) as {
      default: (input: string | Buffer) => {
        metadata: () => Promise<{ width?: number; height?: number }>;
        resize: (...args: unknown[]) => unknown;
        png: (opts: unknown) => { toBuffer: () => Promise<Buffer> };
      };
    } | null;
    if (!sharpModule) {
      return { optimized: false, originalSize, newSize: originalSize };
    }

    const sharp = sharpModule.default;
    const image = sharp(fileBuffer);
    const metadata = await image.metadata();

    // Resize if dimensions exceed max (preserving aspect ratio)
    // biome-ignore lint/suspicious/noExplicitAny: sharp pipeline type is complex
    let pipeline: any = image;
    const needsResize =
      (metadata.width && metadata.width > MAX_IMAGE_DIMENSION) ||
      (metadata.height && metadata.height > MAX_IMAGE_DIMENSION);

    if (needsResize) {
      pipeline = pipeline.resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Compress PNG
    const buffer = await pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();

    // Only write if it actually got smaller
    if (buffer.length < originalSize) {
      writeFileSync(filePath, buffer);
      return { optimized: true, originalSize, newSize: buffer.length };
    }

    return { optimized: false, originalSize, newSize: originalSize };
  } catch {
    // Optimization failed — keep original
    return { optimized: false, originalSize, newSize: originalSize };
  }
}

/**
 * Optimize multiple image files in a directory.
 *
 * @returns Total bytes saved
 */
export async function optimizeImages(filePaths: string[]): Promise<number> {
  let totalSaved = 0;

  for (const filePath of filePaths) {
    const result = await optimizeImage(filePath);
    if (result.optimized) {
      totalSaved += result.originalSize - result.newSize;
    }
  }

  return totalSaved;
}
