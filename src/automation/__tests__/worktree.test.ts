import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execa } from 'execa';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  cleanupAllWorktrees,
  createWorktree,
  listRalphWorktrees,
  listWorktrees,
  removeWorktree,
} from '../worktree.js';

describe('worktree', () => {
  let repoDir: string;

  beforeEach(async () => {
    // Create a temp git repo for testing
    repoDir = mkdtempSync(join(tmpdir(), 'ralph-worktree-test-'));
    await execa('git', ['init', '-b', 'main'], { cwd: repoDir });
    await execa('git', ['config', 'user.email', 'test@test.com'], { cwd: repoDir });
    await execa('git', ['config', 'user.name', 'Test'], { cwd: repoDir });
    // Need at least one commit for worktrees to work
    writeFileSync(join(repoDir, 'README.md'), '# Test');
    await execa('git', ['add', '.'], { cwd: repoDir });
    await execa('git', ['commit', '-m', 'init'], { cwd: repoDir });
  });

  afterEach(async () => {
    // Clean up worktrees first, then remove dir
    try {
      await cleanupAllWorktrees(repoDir);
    } catch {
      // Best effort
    }
    if (existsSync(repoDir)) {
      rmSync(repoDir, { recursive: true, force: true });
    }
  });

  it('should create a worktree with a new branch', async () => {
    const path = await createWorktree(repoDir, 'test-branch');
    expect(existsSync(path)).toBe(true);
    expect(existsSync(join(path, 'README.md'))).toBe(true);

    // Verify branch was created
    const { stdout } = await execa('git', ['branch'], { cwd: repoDir });
    expect(stdout).toContain('test-branch');
  });

  it('should create a worktree from a specific base branch', async () => {
    const path = await createWorktree(repoDir, 'feature-branch', 'main');
    expect(existsSync(path)).toBe(true);

    // Check that the worktree is on the correct branch
    const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: path });
    expect(stdout.trim()).toBe('feature-branch');
  });

  it('should list worktrees', async () => {
    await createWorktree(repoDir, 'wt-1');
    await createWorktree(repoDir, 'wt-2');

    const worktrees = await listWorktrees(repoDir);
    // Main repo + 2 worktrees
    expect(worktrees.length).toBeGreaterThanOrEqual(3);

    const branches = worktrees.map((wt) => wt.branch);
    expect(branches).toContain('wt-1');
    expect(branches).toContain('wt-2');
  });

  it('should list only ralph-managed worktrees', async () => {
    await createWorktree(repoDir, 'ralph-task-1');

    const ralphWorktrees = await listRalphWorktrees(repoDir);
    expect(ralphWorktrees.length).toBe(1);
    expect(ralphWorktrees[0].branch).toBe('ralph-task-1');
  });

  it('should remove a worktree', async () => {
    const path = await createWorktree(repoDir, 'to-remove');
    expect(existsSync(path)).toBe(true);

    await removeWorktree(repoDir, path);
    // After removal, path should not be a valid worktree
    const worktrees = await listWorktrees(repoDir);
    const found = worktrees.find((wt) => wt.branch === 'to-remove');
    expect(found).toBeUndefined();
  });

  it('should cleanup all ralph worktrees', async () => {
    await createWorktree(repoDir, 'cleanup-1');
    await createWorktree(repoDir, 'cleanup-2');

    const beforeCleanup = await listRalphWorktrees(repoDir);
    expect(beforeCleanup.length).toBe(2);

    const removed = await cleanupAllWorktrees(repoDir);
    expect(removed).toBe(2);

    const afterCleanup = await listRalphWorktrees(repoDir);
    expect(afterCleanup.length).toBe(0);
  });
});
