/**
 * Session management commands for ralph-starter
 * Pause and resume functionality for AI coding loops
 */

import chalk from 'chalk';
import {
  deleteSession,
  formatSessionInfo,
  getSessionStatus,
  hasSession,
  isSessionExpired,
  loadSession,
  pauseSession,
} from '../loop/session.js';

export interface PauseCommandOptions {
  verbose?: boolean;
}

export interface ResumeCommandOptions {
  verbose?: boolean;
  force?: boolean;
}

/**
 * Pause command - saves current session state
 */
export async function pauseCommand(options: PauseCommandOptions): Promise<void> {
  const cwd = process.cwd();

  console.log();
  console.log(chalk.bold('Pausing ralph-starter session...'));
  console.log();

  // Check if there's an active session
  const sessionExists = await hasSession(cwd);

  if (!sessionExists) {
    console.log(chalk.yellow('  No active session found.'));
    console.log();
    console.log(chalk.dim('  Sessions are created when you run:'));
    console.log(chalk.dim('    ralph-starter run [task]'));
    console.log();
    process.exit(1);
  }

  // Load and check session state
  const session = await loadSession(cwd);

  if (!session) {
    console.log(chalk.red('  Session file corrupted or expired.'));
    console.log(chalk.dim('  Try starting a new session with: ralph-starter run'));
    console.log();
    process.exit(1);
  }

  // Check if already paused
  if (session.state === 'paused') {
    console.log(chalk.yellow('  Session is already paused.'));
    console.log();
    if (options.verbose) {
      for (const line of formatSessionInfo(session)) {
        console.log(chalk.dim(`  ${line}`));
      }
      console.log();
    }
    console.log(chalk.dim('  To resume, run: ralph-starter resume'));
    console.log();
    process.exit(0);
  }

  // Check if session is completed or failed
  if (session.state === 'completed') {
    console.log(chalk.yellow('  Session has already completed.'));
    console.log(chalk.dim('  Start a new session with: ralph-starter run'));
    console.log();
    process.exit(0);
  }

  if (session.state === 'failed') {
    console.log(chalk.yellow('  Session has failed.'));
    console.log(chalk.dim('  Start a new session with: ralph-starter run'));
    console.log();
    process.exit(0);
  }

  // Pause the session
  const paused = await pauseSession(cwd);

  if (!paused) {
    console.log(chalk.red('  Failed to pause session.'));
    process.exit(1);
  }

  console.log(chalk.green('  Session paused successfully!'));
  console.log();

  // Show session info
  for (const line of formatSessionInfo(paused)) {
    console.log(chalk.dim(`  ${line}`));
  }
  console.log();

  console.log(chalk.dim('  To resume later, run:'));
  console.log(chalk.cyan('    ralph-starter resume'));
  console.log();
  console.log(chalk.dim('  Note: Session will expire after 24 hours.'));
  console.log();
}

/**
 * Resume command - continues from saved session state
 */
export async function resumeCommand(options: ResumeCommandOptions): Promise<void> {
  const cwd = process.cwd();

  console.log();
  console.log(chalk.bold('Resuming ralph-starter session...'));
  console.log();

  // Check if there's an active session
  const sessionExists = await hasSession(cwd);

  if (!sessionExists) {
    console.log(chalk.yellow('  No session found to resume.'));
    console.log();
    console.log(chalk.dim('  Start a new session with:'));
    console.log(chalk.dim('    ralph-starter run [task]'));
    console.log();
    process.exit(1);
  }

  // Load session
  const session = await loadSession(cwd);

  if (!session) {
    console.log(chalk.red('  Session file corrupted.'));
    console.log(chalk.dim('  Try starting a new session with: ralph-starter run'));
    console.log();
    process.exit(1);
  }

  // Check if session is expired
  if (isSessionExpired(session)) {
    console.log(chalk.yellow('  Session has expired (older than 24 hours).'));
    console.log();

    if (options.force) {
      console.log(chalk.dim('  Deleting expired session...'));
      await deleteSession(cwd);
    } else {
      console.log(chalk.dim('  To delete and start fresh, run:'));
      console.log(chalk.dim('    ralph-starter resume --force'));
      console.log();
      console.log(chalk.dim('  Or start a new session:'));
      console.log(chalk.dim('    ralph-starter run [task]'));
    }
    console.log();
    process.exit(1);
  }

  // Check session state
  if (session.state === 'running') {
    console.log(chalk.yellow('  Session is already running.'));
    console.log();
    if (options.verbose) {
      for (const line of formatSessionInfo(session)) {
        console.log(chalk.dim(`  ${line}`));
      }
      console.log();
    }
    console.log(chalk.dim('  If the process crashed, pause first with: ralph-starter pause'));
    console.log();
    process.exit(1);
  }

  if (session.state === 'completed') {
    console.log(chalk.green('  Session has already completed!'));
    console.log();
    if (options.verbose) {
      for (const line of formatSessionInfo(session)) {
        console.log(chalk.dim(`  ${line}`));
      }
      console.log();
    }
    console.log(chalk.dim('  Start a new session with: ralph-starter run'));
    console.log();
    process.exit(0);
  }

  if (session.state === 'failed') {
    console.log(chalk.yellow('  Session failed previously.'));
    console.log();
    for (const line of formatSessionInfo(session)) {
      console.log(chalk.dim(`  ${line}`));
    }
    console.log();

    if (options.force) {
      console.log(chalk.dim('  Deleting failed session...'));
      await deleteSession(cwd);
      console.log(chalk.dim('  Start a new session with: ralph-starter run'));
    } else {
      console.log(chalk.dim('  To delete and start fresh, run:'));
      console.log(chalk.dim('    ralph-starter resume --force'));
    }
    console.log();
    process.exit(1);
  }

  // Session is paused - show info and instructions
  if (session.state !== 'paused') {
    console.log(chalk.yellow(`  Unexpected session state: ${session.state}`));
    process.exit(1);
  }

  // Show session info
  const status = getSessionStatus(session);
  console.log(chalk.green('  Found paused session!'));
  console.log();

  for (const line of formatSessionInfo(session)) {
    console.log(`  ${line}`);
  }
  console.log();

  // Output the command to continue
  // The actual resume will be handled by runCommand when it detects a paused session
  console.log(chalk.dim('  To continue the session, run:'));
  console.log(chalk.cyan('    ralph-starter run'));
  console.log();
  console.log(
    chalk.dim(
      '  The loop will automatically continue from iteration ' + (session.currentIteration + 1)
    )
  );
  console.log();
}

/**
 * Status command - show current session status
 */
export async function sessionStatusCommand(options: { verbose?: boolean }): Promise<void> {
  const cwd = process.cwd();

  console.log();
  console.log(chalk.bold('Session Status'));
  console.log();

  const sessionExists = await hasSession(cwd);

  if (!sessionExists) {
    console.log(chalk.dim('  No active session.'));
    console.log();
    console.log(chalk.dim('  Start a new session with:'));
    console.log(chalk.dim('    ralph-starter run [task]'));
    console.log();
    return;
  }

  const session = await loadSession(cwd);

  if (!session) {
    console.log(chalk.yellow('  Session file exists but cannot be loaded.'));
    console.log(chalk.dim('  It may be corrupted or expired.'));
    console.log();
    return;
  }

  const status = getSessionStatus(session);

  // State indicator
  let stateIndicator: string;
  switch (session.state) {
    case 'running':
      stateIndicator = chalk.green('Running');
      break;
    case 'paused':
      stateIndicator = chalk.yellow('Paused');
      break;
    case 'completed':
      stateIndicator = chalk.blue('Completed');
      break;
    case 'failed':
      stateIndicator = chalk.red('Failed');
      break;
    default:
      stateIndicator = chalk.gray(session.state);
  }

  if (status.isExpired) {
    stateIndicator += chalk.red(' (Expired)');
  }

  console.log(`  ${chalk.bold('State:')} ${stateIndicator}`);
  console.log(`  ${chalk.bold('Progress:')} ${status.progress}`);
  console.log(`  ${chalk.bold('Elapsed:')} ${status.elapsed}`);
  console.log();

  if (options.verbose) {
    for (const line of formatSessionInfo(session)) {
      console.log(chalk.dim(`  ${line}`));
    }
    console.log();
  }

  // Show next action
  switch (session.state) {
    case 'paused':
      console.log(chalk.dim('  To resume: ralph-starter run'));
      break;
    case 'running':
      console.log(chalk.dim('  To pause: ralph-starter pause'));
      break;
    case 'completed':
    case 'failed':
      console.log(chalk.dim('  To start fresh: ralph-starter run [task]'));
      break;
  }
  console.log();
}
