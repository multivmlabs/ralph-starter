import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { appendProjectMemory, formatMemoryPrompt, readProjectMemory } from '../memory.js';

describe('Project Memory', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'ralph-memory-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('readProjectMemory', () => {
    it('should return undefined when no memory exists', () => {
      expect(readProjectMemory(testDir)).toBeUndefined();
    });

    it('should read existing memory', () => {
      const ralphDir = join(testDir, '.ralph');
      mkdirSync(ralphDir, { recursive: true });
      writeFileSync(join(ralphDir, 'memory.md'), '## 2026-03-01\nThis project uses pnpm\n');

      const result = readProjectMemory(testDir);
      expect(result).toContain('pnpm');
    });

    it('should return undefined for empty memory file', () => {
      const ralphDir = join(testDir, '.ralph');
      mkdirSync(ralphDir, { recursive: true });
      writeFileSync(join(ralphDir, 'memory.md'), '');

      expect(readProjectMemory(testDir)).toBeUndefined();
    });
  });

  describe('appendProjectMemory', () => {
    it('should create .ralph directory and memory file', () => {
      appendProjectMemory(testDir, 'Tests are in __tests__/');

      const memoryPath = join(testDir, '.ralph', 'memory.md');
      expect(existsSync(memoryPath)).toBe(true);

      const content = readFileSync(memoryPath, 'utf-8');
      expect(content).toContain('Tests are in __tests__/');
      expect(content).toMatch(/^## \d{4}-\d{2}-\d{2}/);
    });

    it('should append multiple entries', () => {
      appendProjectMemory(testDir, 'Entry 1');
      appendProjectMemory(testDir, 'Entry 2');

      const content = readFileSync(join(testDir, '.ralph', 'memory.md'), 'utf-8');
      expect(content).toContain('Entry 1');
      expect(content).toContain('Entry 2');
    });
  });

  describe('formatMemoryPrompt', () => {
    it('should format memory as a prompt section', () => {
      const result = formatMemoryPrompt('This project uses pnpm');
      expect(result).toContain('Project Memory');
      expect(result).toContain('pnpm');
      expect(result).toContain('.ralph/memory.md');
    });
  });
});
