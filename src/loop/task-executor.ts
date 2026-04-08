/**
 * Task Executor
 *
 * Executes batch tasks sequentially or in parallel (via git worktrees) with git automation.
 */

import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import {
  createBranch,
  createPullRequest,
  getCurrentBranch,
  getDefaultBranch,
  gitCommit,
  gitPush,
  hasUncommittedChanges,
} from '../automation/git.js';
import { cleanupAllWorktrees, createWorktree, removeWorktree } from '../automation/worktree.js';
import type { Agent } from './agents.js';
import { type BatchTask, claimTask } from './batch-fetcher.js';
import { type LoopOptions, runLoop } from './executor.js';

/**
 * Result of executing a single task
 */
export interface TaskResult {
  /** Task that was executed */
  task: BatchTask;
  /** Whether the task completed successfully */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Branch name used */
  branch?: string;
  /** PR URL if created */
  prUrl?: string;
  /** Number of iterations used */
  iterations?: number;
  /** Cost in USD */
  cost?: number;
}

/**
 * Options for batch execution
 */
export interface TaskExecutionOptions {
  /** Tasks to execute */
  tasks: BatchTask[];
  /** Working directory */
  cwd: string;
  /** Agent to use */
  agent: Agent;
  /** Run in auto mode */
  auto?: boolean;
  /** Commit after each task */
  commit?: boolean;
  /** Push to remote */
  push?: boolean;
  /** Create PR */
  pr?: boolean;
  /** Run validation */
  validate?: boolean;
  /** Max iterations per task */
  maxIterations?: number;
  /** Run tasks in parallel using git worktrees */
  parallel?: boolean;
  /** Max concurrent parallel tasks (default: 3) */
  concurrency?: number;
  /** Callback when task starts */
  onTaskStart?: (task: BatchTask, index: number) => void;
  /** Callback when task completes */
  onTaskComplete?: (task: BatchTask, result: TaskResult, index: number) => Promise<void> | void;
  /** Callback when task fails */
  onTaskFail?: (task: BatchTask, error: Error, index: number) => void;
}

/**
 * Execute tasks sequentially with cascading branches, or in parallel via worktrees.
 *
 * Sequential mode: each task creates a branch from the previous task's branch,
 * and PRs cascade: PR3 -> PR2 -> PR1 -> main.
 *
 * Parallel mode (--parallel): each task runs in an isolated git worktree,
 * all PRs target the default branch independently.
 */
export async function executeTaskBatch(options: TaskExecutionOptions): Promise<TaskResult[]> {
  if (options.parallel) {
    return executeTaskBatchParallel(options);
  }

  const {
    tasks,
    cwd,
    agent,
    auto = true,
    commit = true,
    push = true,
    pr = true,
    validate = true,
    maxIterations,
    onTaskStart,
    onTaskComplete,
    onTaskFail,
  } = options;

  const results: TaskResult[] = [];
  const originalBranch = await getCurrentBranch(cwd);
  const defaultBranch = await getDefaultBranch(cwd);
  let previousBranch = originalBranch; // Track for cascading PRs

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const result: TaskResult = {
      task,
      success: false,
    };

    try {
      // Clean transient .ralph/ files between tasks to avoid stale context
      // Preserve durable config (config.yaml) written by ralph-starter init
      const ralphDir = join(cwd, '.ralph');
      if (existsSync(ralphDir)) {
        const transientFiles = ['context.md', 'progress.md', 'acceptance-criteria.md', 'plan.md'];
        for (const file of transientFiles) {
          const fp = join(ralphDir, file);
          if (existsSync(fp)) rmSync(fp);
        }
      }

      // Notify start
      onTaskStart?.(task, i);

      // Claim the task
      await claimTask(task);

      // Create branch for this task (from current HEAD, which is previous branch)
      const branchName = `auto/${task.source}-${task.id}`;
      result.branch = branchName;

      try {
        await createBranch(cwd, branchName);
      } catch {
        // Branch might already exist, try to check it out
        const { execa } = await import('execa');
        await execa('git', ['checkout', branchName], { cwd });
      }

      // Build the task prompt
      const taskPrompt = buildTaskPrompt(task);

      // Run the loop for this task
      const loopOptions: LoopOptions = {
        task: taskPrompt,
        cwd,
        agent,
        auto,
        commit: false, // We handle commits ourselves
        push: false,
        pr: false,
        validate,
        maxIterations: maxIterations ?? 15,
        trackProgress: true,
        trackCost: true,
        skipPlanInstructions: true, // Avoid conflict: task-executor tells agent to ignore IMPLEMENTATION_PLAN.md
      };

      const loopResult = await runLoop(loopOptions);

      result.iterations = loopResult.iterations;
      if (loopResult.stats?.costStats) {
        result.cost = loopResult.stats.costStats.totalCost.totalCost;
      }

      // Check if there are changes to commit
      if (commit && (await hasUncommittedChanges(cwd))) {
        const commitMessage = buildCommitMessage(task);
        await gitCommit(cwd, commitMessage);

        if (push) {
          await gitPush(cwd, branchName);

          if (pr) {
            // Create PR with cascading base:
            // First PR targets the default branch (main/master)
            // Subsequent PRs target the previous auto branch
            const prBase = i === 0 ? defaultBranch : previousBranch;
            // Strip existing conventional commit prefix to avoid duplication (e.g. "feat: feat:")
            const cleanTitle = task.title.replace(
              /^(feat|fix|chore|docs|refactor|test|style|ci|perf|build):\s*/i,
              ''
            );
            const prUrl = await createPullRequest(cwd, {
              title: `feat: ${cleanTitle}`,
              body: buildPrBody(task, result, prBase),
              base: prBase,
            });
            result.prUrl = prUrl;
          }
        }
      }

      result.success = true;
      // Update previousBranch for cascading (stay on this branch for next task)
      previousBranch = branchName;
      await onTaskComplete?.(task, result, i);
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      onTaskFail?.(task, error instanceof Error ? error : new Error('Unknown error'), i);
      await onTaskComplete?.(task, result, i);
      // On failure, do NOT update previousBranch — next task should branch
      // from last successful state, not a broken one
    }
    // NOTE: No finally block that switches back to original branch
    // We want to stay on the current auto branch for cascading

    results.push(result);
  }

  // Switch back to original branch only after ALL tasks complete
  try {
    const { execa } = await import('execa');
    await execa('git', ['checkout', originalBranch], { cwd });
  } catch {
    // Ignore checkout errors
  }

  return results;
}

/**
 * Execute tasks in parallel using git worktrees.
 *
 * Each task runs in an isolated worktree with its own branch,
 * enabling true parallel execution. All PRs target the default branch.
 */
export async function executeTaskBatchParallel(
  options: TaskExecutionOptions
): Promise<TaskResult[]> {
  const {
    tasks,
    cwd,
    agent,
    auto = true,
    commit = true,
    push = true,
    pr = true,
    validate = true,
    maxIterations,
    concurrency = 3,
    onTaskStart,
    onTaskComplete,
    onTaskFail,
  } = options;

  const defaultBranch = await getDefaultBranch(cwd);

  // Clean up any stale worktrees from previous crashed runs
  await cleanupAllWorktrees(cwd);

  // Process tasks with concurrency limit
  const results: TaskResult[] = new Array(tasks.length);
  const executing: Set<Promise<void>> = new Set();

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const index = i;

    const run = async () => {
      const result: TaskResult = { task, success: false };
      const branchName = `auto/${task.source}-${task.id}`;
      result.branch = branchName;
      let worktreePath: string | undefined;

      try {
        onTaskStart?.(task, index);
        await claimTask(task);

        // Create an isolated worktree for this task
        worktreePath = await createWorktree(cwd, branchName, defaultBranch);

        // Build the task prompt
        const taskPrompt = buildTaskPrompt(task);

        // Run the loop in the worktree directory
        const loopOptions: LoopOptions = {
          task: taskPrompt,
          cwd: worktreePath,
          agent,
          auto,
          commit: false,
          push: false,
          pr: false,
          validate,
          maxIterations: maxIterations ?? 15,
          trackProgress: true,
          trackCost: true,
          skipPlanInstructions: true,
        };

        const loopResult = await runLoop(loopOptions);

        result.iterations = loopResult.iterations;
        if (loopResult.stats?.costStats) {
          result.cost = loopResult.stats.costStats.totalCost.totalCost;
        }

        // Commit and push from worktree
        if (commit && (await hasUncommittedChanges(worktreePath))) {
          const commitMessage = buildCommitMessage(task);
          await gitCommit(worktreePath, commitMessage);
        }

        if (push) {
          await gitPush(worktreePath, branchName);

          if (pr) {
            const cleanTitle = task.title.replace(
              /^(feat|fix|chore|docs|refactor|test|style|ci|perf|build):\s*/i,
              ''
            );
            const prUrl = await createPullRequest(worktreePath, {
              title: `feat: ${cleanTitle}`,
              body: buildPrBody(task, result, defaultBranch),
              base: defaultBranch,
            });
            result.prUrl = prUrl;
          }
        }

        result.success = true;
        await onTaskComplete?.(task, result, index);
      } catch (error) {
        result.success = false;
        result.error = error instanceof Error ? error.message : 'Unknown error';
        onTaskFail?.(task, error instanceof Error ? error : new Error('Unknown error'), index);
        await onTaskComplete?.(task, result, index);
      } finally {
        // Clean up the worktree
        if (worktreePath) {
          try {
            await removeWorktree(cwd, worktreePath, false);
          } catch {
            // Best effort cleanup
          }
        }
      }

      results[index] = result;
    };

    const promise = run().finally(() => executing.delete(promise));
    executing.add(promise);

    // Throttle to concurrency limit
    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  // Wait for remaining tasks
  await Promise.allSettled(executing);

  return results;
}

/**
 * Build the task prompt for the agent
 */
function buildTaskPrompt(task: BatchTask): string {
  const lines: string[] = [];

  lines.push(`# Task: ${task.title}`);
  lines.push('');
  lines.push('## CRITICAL INSTRUCTIONS');
  lines.push('');
  lines.push('**ONLY implement what is described in this task. Do NOT:**');
  lines.push('- Add unrelated features or improvements');
  lines.push('- Implement items from IMPLEMENTATION_PLAN.md or other planning files');
  lines.push('- Make changes beyond the scope of this specific issue');
  lines.push('- Add code that is not directly required by this task');
  lines.push('');
  lines.push(`Source: ${task.url}`);
  lines.push('');

  if (task.labels?.length) {
    lines.push(`Labels: ${task.labels.join(', ')}`);
    lines.push('');
  }

  lines.push('## Task Description');
  lines.push('');
  lines.push(task.description || '*No description provided*');
  lines.push('');
  lines.push('## Implementation Guidelines');
  lines.push('');
  lines.push('1. Read and understand the task requirements above');
  lines.push('2. Implement ONLY what is described in this task');
  lines.push('3. Follow existing code patterns and conventions');
  lines.push('4. Ensure the build passes');
  lines.push('5. Do NOT implement anything not explicitly requested');
  lines.push('');
  lines.push(
    'When complete, the changes will be automatically committed and a PR will be created.'
  );

  return lines.join('\n');
}

/**
 * Build commit message for the task
 */
export function buildCommitMessage(task: BatchTask): string {
  // Determine commit type from labels or title
  let type = 'feat';
  const lowerTitle = task.title.toLowerCase();
  const labels = task.labels?.map((l) => l.toLowerCase()) || [];

  if (labels.includes('bug') || lowerTitle.includes('fix') || lowerTitle.includes('bug')) {
    type = 'fix';
  } else if (labels.includes('docs') || lowerTitle.includes('doc')) {
    type = 'docs';
  } else if (labels.includes('refactor') || lowerTitle.includes('refactor')) {
    type = 'refactor';
  } else if (labels.includes('test') || lowerTitle.includes('test')) {
    type = 'test';
  } else if (labels.includes('chore') || lowerTitle.includes('chore')) {
    type = 'chore';
  }

  // Clean up title for commit message
  const title = task.title
    .replace(/^\[(feat|fix|docs|refactor|test|chore|style|ci|perf|build)\]\s*/i, '')
    .replace(/^(feat|fix|chore|docs|refactor|test|style|ci|perf|build):\s*/i, '')
    .trim();

  return `${type}: ${title}\n\nCloses ${task.source}#${task.id}\n\nGenerated by ralph-starter auto mode`;
}

/**
 * Build PR body
 */
export function buildPrBody(task: BatchTask, result: TaskResult, prBase: string): string {
  const lines: string[] = [];

  lines.push('## Summary');
  lines.push('');
  lines.push(`Automated implementation for: ${task.url}`);
  lines.push('');

  if (task.description) {
    lines.push('## Original Task');
    lines.push('');
    lines.push(task.description.slice(0, 500));
    if (task.description.length > 500) {
      lines.push('...');
    }
    lines.push('');
  }

  lines.push('## Execution Details');
  lines.push('');
  lines.push(`- Iterations: ${result.iterations ?? 'N/A'}`);
  lines.push(`- Base branch: \`${prBase}\``);
  if (result.cost) {
    lines.push(`- Estimated cost: $${result.cost.toFixed(4)}`);
  }
  lines.push('');

  // Add merge instructions for cascading PRs
  if (prBase.startsWith('auto/')) {
    lines.push('## Merge Instructions');
    lines.push('');
    lines.push(`This PR is part of a cascade. Merge the base PR first: \`${prBase}\``);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push(
    '*Generated by [ralph-starter](https://github.com/multivmlabs/ralph-starter) auto mode*'
  );

  return lines.join('\n');
}
