/**
 * Dev server detection, startup, and management for visual validation.
 * Detects dev commands from package.json and starts a local dev server
 * with automatic port detection and readiness polling.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execa, type ResultPromise } from 'execa';
import { detectPackageManager, getRunCommand } from '../utils/package-manager.js';

export interface DevServerInfo {
  url: string;
  port: number;
  process: ResultPromise;
  kill: () => Promise<void>;
}

/**
 * Known default ports for common frameworks.
 */
const FRAMEWORK_PORTS: Record<string, number> = {
  vite: 5173,
  next: 3000,
  'react-scripts': 3000,
  nuxt: 3000,
  astro: 4321,
  svelte: 5173,
  remix: 3000,
  gatsby: 8000,
};

/**
 * Detect the dev command and likely port from package.json.
 */
export function detectDevCommand(
  cwd: string
): { command: string; args: string[]; port: number } | null {
  const packagePath = join(cwd, 'package.json');
  if (!existsSync(packagePath)) return null;

  try {
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
    const scripts = pkg.scripts || {};
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies } as Record<string, string>;
    const pm = detectPackageManager(cwd);

    // Find a dev script
    let scriptName: string | null = null;
    for (const name of ['dev', 'start', 'serve', 'preview']) {
      if (scripts[name]) {
        scriptName = name;
        break;
      }
    }

    if (!scriptName) return null;

    const cmd = getRunCommand(pm, scriptName);
    const scriptContent = scripts[scriptName] || '';

    // Try to detect port from script content (e.g. --port 3001)
    const portMatch = scriptContent.match(/--port\s+(\d+)|-p\s+(\d+)/);
    if (portMatch) {
      const port = Number.parseInt(portMatch[1] || portMatch[2], 10);
      return { ...cmd, port };
    }

    // Detect port from framework
    for (const [framework, port] of Object.entries(FRAMEWORK_PORTS)) {
      if (allDeps[framework] || scriptContent.includes(framework)) {
        return { ...cmd, port };
      }
    }

    // Fallback to port 3000
    return { ...cmd, port: 3000 };
  } catch {
    return null;
  }
}

/**
 * Poll a URL until it responds with a 200 status or timeout is reached.
 */
async function waitForServer(url: string, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  const pollInterval = 500;

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok || response.status === 304) {
        return true;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  return false;
}

/**
 * Start a dev server, wait for it to be ready, and return a handle.
 * Returns null if no dev command is detected or the server fails to start.
 */
export async function startDevServer(
  cwd: string,
  timeoutMs = 30_000
): Promise<DevServerInfo | null> {
  const devCmd = detectDevCommand(cwd);
  if (!devCmd) return null;

  const url = `http://localhost:${devCmd.port}`;

  // Check if something is already running on that port
  const alreadyRunning = await waitForServer(url, 2000);
  if (alreadyRunning) {
    return {
      url,
      port: devCmd.port,
      process: null as unknown as ResultPromise,
      kill: async () => {}, // Nothing to kill — not our process
    };
  }

  // Start the dev server as a detached background process
  const proc = execa(devCmd.command, devCmd.args, {
    cwd,
    stdio: 'pipe',
    reject: false,
    detached: false,
    env: {
      ...process.env,
      // Force non-interactive mode and disable browser open
      BROWSER: 'none',
      CI: 'true',
    },
  });

  // Wait for the server to be ready
  const ready = await waitForServer(url, timeoutMs);

  if (!ready) {
    // Server didn't start in time — kill it
    proc.kill('SIGTERM');
    return null;
  }

  return {
    url,
    port: devCmd.port,
    process: proc,
    kill: async () => {
      try {
        proc.kill('SIGTERM');
        // Give it a moment to shut down gracefully
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (!proc.killed) {
          proc.kill('SIGKILL');
        }
      } catch {
        // Process already exited
      }
    },
  };
}
