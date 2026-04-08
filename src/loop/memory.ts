/**
 * Project Memory
 *
 * Persistent memory file (.ralph/memory.md) that survives across separate `ralph run` invocations.
 * The agent can learn project conventions, tool preferences, and patterns over time.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MEMORY_FILE = 'memory.md';
const MAX_MEMORY_BYTES = 8 * 1024; // 8KB max — keeps context window usage reasonable

/**
 * Read the project memory file.
 * Returns undefined if no memory exists yet.
 */
export function readProjectMemory(cwd: string, dotDir = '.ralph'): string | undefined {
  try {
    const memoryPath = join(cwd, dotDir, MEMORY_FILE);
    if (!existsSync(memoryPath)) return undefined;

    const content = readFileSync(memoryPath, 'utf-8').trim();
    if (!content) return undefined;

    // Truncate if too large (keep the most recent entries)
    if (Buffer.byteLength(content) > MAX_MEMORY_BYTES) {
      const entries = content.split(/^## /m).filter((e) => e.trim());
      let result = '';
      // Build from newest to oldest, staying under budget
      for (let i = entries.length - 1; i >= 0; i--) {
        const entry = `## ${entries[i]}`;
        if (Buffer.byteLength(result + entry) > MAX_MEMORY_BYTES) break;
        result = entry + result;
      }
      return result.trim() || undefined;
    }

    return content;
  } catch {
    return undefined;
  }
}

/**
 * Append an entry to the project memory file.
 */
export function appendProjectMemory(cwd: string, entry: string, dotDir = '.ralph'): void {
  try {
    const stateDir = join(cwd, dotDir);
    if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true });

    const memoryPath = join(stateDir, MEMORY_FILE);
    const timestamp = new Date().toISOString().split('T')[0];
    const formatted = `## ${timestamp}\n${entry.trim()}\n\n`;

    appendFileSync(memoryPath, formatted);
  } catch {
    // Non-critical — don't break the loop
  }
}

/**
 * Format memory content as a prompt section for injection into agent context.
 */
export function formatMemoryPrompt(memory: string, dotDir = '.ralph'): string {
  return `## Project Memory (from previous runs)
The following notes were saved from previous runs on this project.
Use them to understand project conventions and avoid repeating mistakes.

${memory}

If you discover new project conventions or important patterns, append them to \`${dotDir}/memory.md\`.
`;
}
