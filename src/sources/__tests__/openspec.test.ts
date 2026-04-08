import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenSpecSource } from '../builtin/openspec.js';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn(),
}));

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockReaddirSync = vi.mocked(readdirSync);
const mockStatSync = vi.mocked(statSync);

const dirStat = { isFile: () => false, isDirectory: () => true } as any;
const fileStat = { isFile: () => true, isDirectory: () => false } as any;

describe('OpenSpecSource', () => {
  let source: OpenSpecSource;

  beforeEach(() => {
    vi.clearAllMocks();
    source = new OpenSpecSource();
  });

  describe('isAvailable', () => {
    it('should always return true', async () => {
      expect(await source.isAvailable()).toBe(true);
    });
  });

  describe('fetch - list changes', () => {
    it('should list active changes', async () => {
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.endsWith('openspec')) return true;
        if (path.endsWith('changes')) return true;
        if (path.endsWith('proposal.md')) return true;
        if (path.endsWith('design.md')) return false;
        if (path.endsWith('tasks.md')) return true;
        if (path.endsWith('specs')) return false;
        return false;
      });
      mockStatSync.mockReturnValue(dirStat);
      mockReaddirSync.mockReturnValue(['add-auth', 'fix-login'] as any);

      const result = await source.fetch('');

      expect(result.content).toContain('OpenSpec Changes');
      expect(result.content).toContain('add-auth');
      expect(result.content).toContain('fix-login');
      expect(result.metadata?.count).toBe(2);
    });

    it('should show empty when no changes exist', async () => {
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        return path.endsWith('openspec') || path.endsWith('changes');
      });
      mockStatSync.mockReturnValue(dirStat);
      mockReaddirSync.mockReturnValue([] as any);

      const result = await source.fetch('list');

      expect(result.content).toContain('No active changes found');
      expect(result.metadata?.count).toBe(0);
    });

    it('should exclude archive directory', async () => {
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        return path.endsWith('openspec') || path.endsWith('changes');
      });
      mockStatSync.mockReturnValue(dirStat);
      mockReaddirSync.mockReturnValue(['archive', 'real-change'] as any);

      const result = await source.fetch('list');

      expect(result.content).not.toContain('archive');
      expect(result.content).toContain('real-change');
    });
  });

  describe('fetch - specific change', () => {
    it('should concatenate all change files', async () => {
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.endsWith('openspec')) return true;
        if (path.includes('changes/my-feature')) return true;
        if (path.endsWith('proposal.md')) return true;
        if (path.endsWith('design.md')) return true;
        if (path.endsWith('tasks.md')) return true;
        if (path.endsWith('specs')) return true;
        if (path.endsWith('spec.md')) return true;
        return false;
      });
      mockStatSync.mockReturnValue(dirStat);
      mockReaddirSync.mockReturnValue(['auth'] as any);
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.endsWith('proposal.md')) return 'Why we need this';
        if (path.endsWith('design.md')) return 'How we build it';
        if (path.endsWith('tasks.md')) return '- [ ] Step 1\n- [ ] Step 2';
        if (path.endsWith('spec.md')) return '# Auth Spec\nSHALL authenticate users';
        return '';
      });

      const result = await source.fetch('my-feature');

      expect(result.content).toContain('# OpenSpec Change: my-feature');
      expect(result.content).toContain('## Proposal');
      expect(result.content).toContain('Why we need this');
      expect(result.content).toContain('## Design');
      expect(result.content).toContain('How we build it');
      expect(result.content).toContain('## Tasks');
      expect(result.content).toContain('Step 1');
      expect(result.content).toContain('### auth');
      expect(result.content).toContain('SHALL authenticate users');
      expect(result.metadata?.hasProposal).toBe(true);
      expect(result.metadata?.hasDesign).toBe(true);
      expect(result.metadata?.hasTasks).toBe(true);
      expect(result.metadata?.specAreas).toEqual(['auth']);
    });

    it('should skip missing optional files', async () => {
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        // Check specific file types before directory matches
        if (path.endsWith('proposal.md')) return true;
        if (path.endsWith('design.md')) return false;
        if (path.endsWith('tasks.md')) return false;
        if (path.endsWith('specs')) return false;
        if (path.endsWith('openspec')) return true;
        if (path.includes('changes/minimal')) return true;
        return false;
      });
      mockStatSync.mockReturnValue(dirStat);
      mockReadFileSync.mockReturnValue('Just a proposal');

      const result = await source.fetch('minimal');

      expect(result.content).toContain('## Proposal');
      expect(result.content).not.toContain('## Design');
      expect(result.content).not.toContain('## Tasks');
      expect(result.metadata?.hasDesign).toBe(false);
      expect(result.metadata?.hasTasks).toBe(false);
    });

    it('should throw when change does not exist', async () => {
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.endsWith('openspec')) return true;
        return false;
      });
      mockStatSync.mockReturnValue(dirStat);

      await expect(source.fetch('nonexistent')).rejects.toThrow('Change not found: nonexistent');
    });
  });

  describe('fetch - all changes', () => {
    it('should concatenate all active changes', async () => {
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.endsWith('openspec')) return true;
        if (path.endsWith('changes')) return true;
        if (path.includes('changes/alpha') || path.includes('changes/beta')) return true;
        if (path.endsWith('proposal.md')) return true;
        return false;
      });
      mockStatSync.mockReturnValue(dirStat);
      mockReaddirSync.mockImplementation((p) => {
        const path = String(p);
        if (path.endsWith('changes')) return ['alpha', 'beta'] as any;
        return [] as any;
      });
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes('alpha')) return 'Alpha proposal';
        if (path.includes('beta')) return 'Beta proposal';
        return '';
      });

      const result = await source.fetch('all');

      expect(result.content).toContain('OpenSpec Change: alpha');
      expect(result.content).toContain('OpenSpec Change: beta');
      expect(result.content).toContain('Alpha proposal');
      expect(result.content).toContain('Beta proposal');
      expect(result.metadata?.count).toBe(2);
    });

    it('should throw when no active changes', async () => {
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        return path.endsWith('openspec') || path.endsWith('changes');
      });
      mockStatSync.mockReturnValue(dirStat);
      mockReaddirSync.mockReturnValue([] as any);

      await expect(source.fetch('all')).rejects.toThrow('No active changes found');
    });
  });

  describe('fetch - global specs', () => {
    it('should read all global specs', async () => {
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.endsWith('openspec')) return true;
        if (path.endsWith('specs')) return true;
        if (path.endsWith('spec.md')) return true;
        return false;
      });
      mockStatSync.mockReturnValue(dirStat);
      mockReaddirSync.mockReturnValue(['api', 'database'] as any);
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes('api')) return '# API Spec';
        if (path.includes('database')) return '# DB Spec';
        return '';
      });

      const result = await source.fetch('specs');

      expect(result.content).toContain('## api');
      expect(result.content).toContain('# API Spec');
      expect(result.content).toContain('## database');
      expect(result.content).toContain('# DB Spec');
      expect(result.metadata?.count).toBe(2);
    });

    it('should throw when specs directory missing', async () => {
      mockExistsSync.mockImplementation((p) => {
        const path = String(p);
        if (path.endsWith('openspec')) return true;
        return false;
      });
      mockStatSync.mockReturnValue(dirStat);

      await expect(source.fetch('global')).rejects.toThrow('No openspec/specs/ directory found');
    });
  });

  describe('error handling', () => {
    it('should throw when no openspec directory', async () => {
      mockExistsSync.mockReturnValue(false);

      await expect(source.fetch('')).rejects.toThrow('No openspec/ directory found');
    });
  });

  describe('getHelp', () => {
    it('should return help text', () => {
      const help = source.getHelp();

      expect(help).toContain('openspec');
      expect(help).toContain('--from openspec');
      expect(help).toContain('list');
    });
  });
});
