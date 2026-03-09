import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  formatPresetsHelp,
  getPreset,
  getPresetNames,
  getPresetsByCategory,
  loadCustomPresets,
  PRESETS,
} from '../index.js';

describe('presets', () => {
  describe('built-in presets', () => {
    it('should have at least 15 built-in presets', () => {
      expect(Object.keys(PRESETS).length).toBeGreaterThanOrEqual(15);
    });

    it('should return preset by name', () => {
      const preset = getPreset('feature');
      expect(preset).toBeDefined();
      expect(preset?.name).toBe('feature');
      expect(preset?.maxIterations).toBe(30);
    });

    it('should return undefined for unknown preset', () => {
      expect(getPreset('nonexistent')).toBeUndefined();
    });

    it('should list all preset names', () => {
      const names = getPresetNames();
      expect(names).toContain('feature');
      expect(names).toContain('debug');
      expect(names).toContain('review');
    });

    it('should group presets by category', () => {
      const categories = getPresetsByCategory();
      expect(categories.Development).toBeDefined();
      expect(categories.Debugging).toBeDefined();
      expect(categories.Review).toBeDefined();
      expect(categories.Documentation).toBeDefined();
      expect(categories.Specialized).toBeDefined();
    });

    it('should format presets help text', () => {
      const help = formatPresetsHelp();
      expect(help).toContain('Available presets:');
      expect(help).toContain('Development:');
      expect(help).toContain('feature');
    });
  });

  describe('custom presets', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), 'ralph-presets-test-'));
    });

    afterEach(() => {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true });
      }
    });

    it('should return empty when no .ralph/presets directory exists', () => {
      const custom = loadCustomPresets(tempDir);
      expect(custom).toEqual({});
    });

    it('should load valid custom preset from JSON', () => {
      const presetsDir = join(tempDir, '.ralph', 'presets');
      mkdirSync(presetsDir, { recursive: true });
      writeFileSync(
        join(presetsDir, 'my-workflow.json'),
        JSON.stringify({
          description: 'My custom workflow',
          maxIterations: 25,
          validate: true,
          commit: false,
          promptPrefix: 'Do custom things',
        })
      );

      const custom = loadCustomPresets(tempDir);
      expect(custom['my-workflow']).toBeDefined();
      expect(custom['my-workflow'].name).toBe('my-workflow');
      expect(custom['my-workflow'].description).toBe('My custom workflow');
      expect(custom['my-workflow'].maxIterations).toBe(25);
      expect(custom['my-workflow'].promptPrefix).toBe('Do custom things');
    });

    it('should skip invalid JSON files', () => {
      const presetsDir = join(tempDir, '.ralph', 'presets');
      mkdirSync(presetsDir, { recursive: true });
      writeFileSync(join(presetsDir, 'bad.json'), 'not valid json');

      const custom = loadCustomPresets(tempDir);
      expect(custom).toEqual({});
    });

    it('should skip presets missing required fields', () => {
      const presetsDir = join(tempDir, '.ralph', 'presets');
      mkdirSync(presetsDir, { recursive: true });
      writeFileSync(
        join(presetsDir, 'incomplete.json'),
        JSON.stringify({ description: 'Missing fields' })
      );

      const custom = loadCustomPresets(tempDir);
      expect(custom).toEqual({});
    });

    it('should use name from JSON if provided', () => {
      const presetsDir = join(tempDir, '.ralph', 'presets');
      mkdirSync(presetsDir, { recursive: true });
      writeFileSync(
        join(presetsDir, 'file.json'),
        JSON.stringify({
          name: 'custom-name',
          description: 'Named preset',
          maxIterations: 10,
          validate: false,
          commit: true,
        })
      );

      const custom = loadCustomPresets(tempDir);
      expect(custom['custom-name']).toBeDefined();
      expect(custom['custom-name'].name).toBe('custom-name');
    });

    it('should include custom presets in getPreset with cwd', () => {
      const presetsDir = join(tempDir, '.ralph', 'presets');
      mkdirSync(presetsDir, { recursive: true });
      writeFileSync(
        join(presetsDir, 'my-hat.json'),
        JSON.stringify({
          description: 'Custom hat',
          maxIterations: 5,
          validate: false,
          commit: false,
        })
      );

      const preset = getPreset('my-hat', tempDir);
      expect(preset).toBeDefined();
      expect(preset?.name).toBe('my-hat');
    });

    it('should include custom presets in getPresetNames with cwd', () => {
      const presetsDir = join(tempDir, '.ralph', 'presets');
      mkdirSync(presetsDir, { recursive: true });
      writeFileSync(
        join(presetsDir, 'extra.json'),
        JSON.stringify({
          description: 'Extra',
          maxIterations: 10,
          validate: false,
          commit: false,
        })
      );

      const names = getPresetNames(tempDir);
      expect(names).toContain('extra');
      expect(names).toContain('feature'); // still has built-in
    });

    it('should show Custom category in getPresetsByCategory', () => {
      const presetsDir = join(tempDir, '.ralph', 'presets');
      mkdirSync(presetsDir, { recursive: true });
      writeFileSync(
        join(presetsDir, 'team-deploy.json'),
        JSON.stringify({
          description: 'Team deploy workflow',
          maxIterations: 15,
          validate: true,
          commit: true,
        })
      );

      const categories = getPresetsByCategory(tempDir);
      expect(categories.Custom).toBeDefined();
      expect(categories.Custom.length).toBe(1);
      expect(categories.Custom[0].name).toBe('team-deploy');
    });
  });
});
