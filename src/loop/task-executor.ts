/**
 * Task Executor
 *
 * Executes batch tasks sequentially with git automation.
 */

import chalk from 'chalk';
import {
  createBranch,
  createPullRequest,
  getCurrentBranch,
  gitCommit,
  gitPush,
  hasUncommittedChanges,
} from '../automation/git.js';
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
  /** Callback when task starts */
  onTaskStart?: (task: BatchTask, index: number) => void;
  /** Callback when task completes */
  onTaskComplete?: (task: BatchTask, result: TaskResult, index: number) => Promise<void> | void;
  /** Callback when task fails */
  onTaskFail?: (task: BatchTask, error: Error, index: number) => void;
}

/**
 * Execute tasks sequentially
 */
export async function executeTaskBatch(options: TaskExecutionOptions): Promise<TaskResult[]> {
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
  const baseBranch = await getCurrentBranch(cwd);

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const result: TaskResult = {
      task,
      success: false,
    };

    try {
      // Notify start
      onTaskStart?.(task, i);

      // Claim the task
      await claimTask(task);

      // Create branch for this task
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
      };

      const loopResult = await runLoop(loopOptions);

      result.iterations = loopResult.iterations;
      // Cost tracking is handled by the loop internally

      // Check if there are changes to commit
      if (commit && (await hasUncommittedChanges(cwd))) {
        const commitMessage = buildCommitMessage(task);
        await gitCommit(cwd, commitMessage);

        if (push) {
          await gitPush(cwd, branchName);

          if (pr) {
            // Create PR - returns the PR URL directly
            const prUrl = await createPullRequest(cwd, {
              title: `[Auto] ${task.title}`,
              body: buildPrBody(task, result),
              base: baseBranch,
            });
            result.prUrl = prUrl;
          }
        }
      }

      result.success = true;
      await onTaskComplete?.(task, result, i);
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      onTaskFail?.(task, error instanceof Error ? error : new Error('Unknown error'), i);
      await onTaskComplete?.(task, result, i);
    } finally {
      // Always switch back to base branch
      try {
        const { execa } = await import('execa');
        await execa('git', ['checkout', baseBranch], { cwd });
      } catch {
        // Ignore checkout errors
      }
    }

    results.push(result);
  }

  return results;
}

/**
 * Build the task prompt for the agent
 */
function buildTaskPrompt(task: BatchTask): string {
  const lines: string[] = [];

  lines.push(`# Task: ${task.title}`);
  lines.push('');
  lines.push(`Source: ${task.url}`);
  lines.push('');

  if (task.labels?.length) {
    lines.push(`Labels: ${task.labels.join(', ')}`);
    lines.push('');
  }

  lines.push('## Description');
  lines.push('');
  lines.push(task.description || '*No description provided*');
  lines.push('');
  lines.push('## Instructions');
  lines.push('');
  lines.push('1. Analyze the task requirements');
  lines.push('2. Implement the necessary changes');
  lines.push('3. Ensure tests pass (if applicable)');
  lines.push('4. Follow existing code patterns');
  lines.push('');
  lines.push(
    'When complete, the changes will be automatically committed and a PR will be created.'
  );

  return lines.join('\n');
}

/**
 * Build commit message for the task
 */
function buildCommitMessage(task: BatchTask): string {
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
    .replace(/^\[(feat|fix|docs|refactor|test|chore)\]\s*/i, '')
    .replace(/^(feat|fix|docs|refactor|test|chore):\s*/i, '')
    .trim();

  return `${type}: ${title}\n\nCloses ${task.source}#${task.id}\n\nGenerated by ralph-starter auto mode`;
}

/**
 * Build PR body
 */
function buildPrBody(task: BatchTask, result: TaskResult): string {
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
  if (result.cost) {
    lines.push(`- Estimated cost: $${result.cost.toFixed(4)}`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(
    '*Generated by [ralph-starter](https://github.com/rubenmarcus/ralph-starter) auto mode*'
  );

  return lines.join('\n');
}
