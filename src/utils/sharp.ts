/**
 * Sharp module helper — ensures sharp is available with auto-install fallback.
 *
 * Sharp is used for image cropping, resizing, and optimization throughout
 * the Figma pipeline. This module provides a reliable way to import it,
 * with auto-install in the target project if not already available.
 */

import { execa } from 'execa';

// biome-ignore lint: sharp types are complex, using any for the module interface
export type SharpInstance = any;

// biome-ignore lint: sharp types are complex
export type SharpModule = {
  default: (input: Buffer | string) => SharpInstance;
};

let cachedModule: SharpModule | null = null;

async function tryImportSharp(): Promise<SharpModule | null> {
  if (cachedModule) return cachedModule;
  try {
    const mod = await import('sharp');
    cachedModule = mod as unknown as SharpModule;
    return cachedModule;
  } catch {
    return null;
  }
}

/**
 * Ensure sharp is available. If not found, auto-install it in the target
 * project's node_modules (same pattern as Playwright in visual-validation.ts).
 *
 * Returns the sharp module or null if installation fails.
 */
export async function ensureSharp(
  log?: (msg: string) => void,
  cwd?: string
): Promise<SharpModule | null> {
  const s = await tryImportSharp();
  if (s) return s;

  const print = log || (() => {});
  const installDir = cwd || process.cwd();
  print('Installing sharp for image processing...');

  try {
    await execa('npm', ['install', '--no-save', 'sharp'], {
      cwd: installDir,
      timeout: 120_000,
      reject: true,
    });

    const sAfter = await tryImportSharp();
    if (sAfter) {
      print('Sharp installed successfully');
      return sAfter;
    }

    // Fallback: import from the project's node_modules using createRequire
    try {
      const { createRequire } = await import('node:module');
      const { join } = await import('node:path');
      const projectRequire = createRequire(join(installDir, 'package.json'));
      const sharpFromProject = projectRequire('sharp');
      if (sharpFromProject) {
        cachedModule = { default: sharpFromProject } as SharpModule;
        print('Sharp installed successfully');
        return cachedModule;
      }
    } catch {
      // createRequire fallback failed
    }
  } catch {
    print('Failed to auto-install sharp — image processing will be limited');
  }

  return null;
}
