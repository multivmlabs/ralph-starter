/**
 * Linear Status Sync
 *
 * Syncs loop execution status to a Linear issue in real-time.
 * Updates issue state at key transitions: start → In Progress, complete → Done, failed → In Review.
 */

import chalk from 'chalk';
import { LinearIntegration } from '../integrations/linear/source.js';

export type LinearSyncConfig = {
  /** Linear issue identifier (e.g., "ENG-42") or UUID */
  issueId: string;
  /** Suppress console output */
  headless?: boolean;
};

export type LinearSyncEvent =
  | { type: 'start' }
  | { type: 'iteration'; iteration: number; totalIterations: number; success: boolean }
  | { type: 'complete'; summary: string; commits: number; iterations: number; cost?: string }
  | { type: 'failed'; error: string; iterations: number };

/**
 * Creates a Linear sync handler that updates issue status at key loop transitions.
 *
 * Returns null if auth is missing or the issue can't be found (non-blocking).
 */
export async function createLinearSync(
  config: LinearSyncConfig
): Promise<((event: LinearSyncEvent) => Promise<void>) | null> {
  const linear = new LinearIntegration();
  const log = config.headless ? (..._args: unknown[]) => {} : console.log.bind(console);

  // Verify auth + issue exist by moving to "In Progress" (non-blocking on failure)
  try {
    await linear.updateTask(config.issueId, { status: 'In Progress' });
    log(chalk.dim(`  Linear sync: ${config.issueId} → In Progress`));
  } catch (err) {
    log(
      chalk.yellow(`  Linear sync: could not update ${config.issueId} — ${(err as Error).message}`)
    );
    return null;
  }

  return async (event: LinearSyncEvent) => {
    try {
      switch (event.type) {
        case 'start':
          // Already moved to "In Progress" during init
          break;

        case 'iteration':
          // No status change per iteration
          break;

        case 'complete': {
          const lines = ['**Loop completed successfully**', ''];
          lines.push(`- Iterations: ${event.iterations}`);
          if (event.commits > 0) lines.push(`- Commits: ${event.commits}`);
          if (event.cost) lines.push(`- Cost: ${event.cost}`);
          if (event.summary) {
            lines.push('', `**Summary:** ${event.summary.slice(0, 500)}`);
          }

          await linear.updateTask(config.issueId, { status: 'Done' });
          await linear.addComment(config.issueId, lines.join('\n'));
          log(chalk.dim(`  Linear sync: ${config.issueId} → Done`));
          break;
        }

        case 'failed': {
          const lines = ['**Loop stopped**', ''];
          lines.push(`- Iterations: ${event.iterations}`);
          if (event.error) {
            lines.push(`- Reason: ${event.error.slice(0, 300)}`);
          }

          await linear.updateTask(config.issueId, { status: 'In Review' });
          await linear.addComment(config.issueId, lines.join('\n'));
          log(chalk.dim(`  Linear sync: ${config.issueId} → In Review`));
          break;
        }
      }
    } catch (err) {
      // Non-blocking — log and continue
      if (process.env.RALPH_DEBUG) {
        console.error(`[DEBUG] Linear sync error: ${(err as Error).message}`);
      }
    }
  };
}
