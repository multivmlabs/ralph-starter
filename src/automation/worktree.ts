/**
 * Git Worktree Management
 *
 * Provides lifecycle management for git worktrees, enabling
 * parallel task execution in isolated working directories.
 */

import { existsSync, mkdirSync, realpathSync } from 'node:fs';
import { basename, join } from 'node:path';
import { execa } from 'execa';

export type WorktreeInfo = {
  path: string;
  branch: string;
  head: string;
  bare: boolean;
};

/**
 * Create a new git worktree with its own branch.
 * Returns the absolute path to the worktree directory.
 */
export async function createWorktree(
  repoDir: string,
  branchName: string,
  baseBranch?: string
): Promise<string> {
  const worktreeDir = join(repoDir, '.ralph', 'worktrees', branchName);

  // Ensure parent directory exists
  const parentDir = join(repoDir, '.ralph', 'worktrees');
  if (!existsSync(parentDir)) {
    mkdirSync(parentDir, { recursive: true });
  }

  // Create worktree with a new branch
  const args = ['worktree', 'add', '-b', branchName, worktreeDir];
  if (baseBranch) {
    args.push(baseBranch);
  }

  try {
    await execa('git', args, { cwd: repoDir });
  } catch (error) {
    // Branch might already exist — try without -b
    await execa('git', ['worktree', 'add', worktreeDir, branchName], { cwd: repoDir });
  }

  return worktreeDir;
}

/**
 * Remove a worktree and optionally delete its branch.
 */
export async function removeWorktree(
  repoDir: string,
  worktreePath: string,
  deleteBranch = false
): Promise<void> {
  const branchName = basename(worktreePath);

  // Remove the worktree
  try {
    await execa('git', ['worktree', 'remove', worktreePath, '--force'], { cwd: repoDir });
  } catch {
    // If remove fails, try prune
    await execa('git', ['worktree', 'prune'], { cwd: repoDir });
  }

  // Optionally delete the branch
  if (deleteBranch) {
    try {
      await execa('git', ['branch', '-D', branchName], { cwd: repoDir });
    } catch {
      // Branch may not exist or may be checked out elsewhere
    }
  }
}

/**
 * List all worktrees for a repository.
 */
export async function listWorktrees(repoDir: string): Promise<WorktreeInfo[]> {
  const { stdout } = await execa('git', ['worktree', 'list', '--porcelain'], { cwd: repoDir });

  if (!stdout.trim()) {
    return [];
  }

  const worktrees: WorktreeInfo[] = [];
  let current: Partial<WorktreeInfo> = {};

  for (const line of stdout.split('\n')) {
    if (line.startsWith('worktree ')) {
      if (current.path) {
        worktrees.push(current as WorktreeInfo);
      }
      current = { path: line.slice('worktree '.length), bare: false };
    } else if (line.startsWith('HEAD ')) {
      current.head = line.slice('HEAD '.length);
    } else if (line.startsWith('branch ')) {
      current.branch = line.slice('branch '.length).replace('refs/heads/', '');
    } else if (line === 'bare') {
      current.bare = true;
    } else if (line === '' && current.path) {
      worktrees.push(current as WorktreeInfo);
      current = {};
    }
  }

  // Push last entry if not pushed
  if (current.path) {
    worktrees.push(current as WorktreeInfo);
  }

  return worktrees;
}

/**
 * List only ralph-managed worktrees (those under .ralph/worktrees/).
 */
export async function listRalphWorktrees(repoDir: string): Promise<WorktreeInfo[]> {
  const all = await listWorktrees(repoDir);
  // Resolve symlinks (e.g., /tmp → /private/tmp on macOS) so paths match
  let worktreePrefix: string;
  try {
    worktreePrefix = realpathSync(join(repoDir, '.ralph', 'worktrees'));
  } catch {
    // Directory doesn't exist yet
    worktreePrefix = join(repoDir, '.ralph', 'worktrees');
  }
  return all.filter((wt) => wt.path.startsWith(worktreePrefix));
}

/**
 * Remove all ralph-created worktrees (crash recovery / cleanup).
 */
export async function cleanupAllWorktrees(repoDir: string): Promise<number> {
  const ralphWorktrees = await listRalphWorktrees(repoDir);
  let removed = 0;

  for (const wt of ralphWorktrees) {
    try {
      await removeWorktree(repoDir, wt.path, false);
      removed++;
    } catch {
      // Best effort cleanup
    }
  }

  // Prune any stale worktree references
  try {
    await execa('git', ['worktree', 'prune'], { cwd: repoDir });
  } catch {
    // Ignore prune errors
  }

  return removed;
}

/**
 * Merge changes from a worktree branch back into the target branch.
 */
export async function mergeWorktreeBranch(
  repoDir: string,
  worktreeBranch: string,
  targetBranch: string
): Promise<boolean> {
  try {
    // Checkout target branch in main repo
    await execa('git', ['checkout', targetBranch], { cwd: repoDir });
    // Merge the worktree branch
    await execa('git', ['merge', worktreeBranch, '--no-edit'], { cwd: repoDir });
    return true;
  } catch {
    // Merge conflict or other issue
    try {
      await execa('git', ['merge', '--abort'], { cwd: repoDir });
    } catch {
      // Nothing to abort
    }
    return false;
  }
}
