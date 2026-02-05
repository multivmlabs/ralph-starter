import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { CostTrackerStats } from './cost-tracker.js';
import type { ValidationResult } from './validation.js';

/**
 * Session state for pause/resume functionality
 */

export type SessionState = 'running' | 'paused' | 'completed' | 'failed';

export interface SessionCheckpoint {
  lastCommit?: string;
  lastOutput?: string;
  validationResults?: ValidationResult[];
  circuitBreakerState?: {
    consecutiveFailures: number;
    totalFailures: number;
    uniqueErrors: number;
  };
  costStats?: CostTrackerStats;
}

export interface SessionOptions {
  commit?: boolean;
  push?: boolean;
  pr?: boolean;
  validate?: boolean;
  auto?: boolean;
  preset?: string;
  completionPromise?: string;
  requireExitSignal?: boolean;
  rateLimit?: number;
  trackProgress?: boolean;
  trackCost?: boolean;
  model?: string;
}

export interface SessionData {
  id: string;
  startedAt: string;
  pausedAt?: string;
  resumedAt?: string;
  task: string;
  currentIteration: number;
  maxIterations: number;
  state: SessionState;
  checkpoint: SessionCheckpoint;
  options: SessionOptions;
  commits: string[];
  cwd: string;
  agentName: string;
}

const SESSION_FILE = '.ralph-session.json';
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Get the session file path for a directory
 */
export function getSessionPath(cwd: string): string {
  return path.join(cwd, SESSION_FILE);
}

/**
 * Check if a session exists
 */
export async function hasSession(cwd: string): Promise<boolean> {
  try {
    await fs.access(getSessionPath(cwd));
    return true;
  } catch {
    return false;
  }
}

/**
 * Load session data from file
 */
export async function loadSession(cwd: string): Promise<SessionData | null> {
  const sessionPath = getSessionPath(cwd);

  try {
    const content = await fs.readFile(sessionPath, 'utf-8');
    const session = JSON.parse(content) as SessionData;

    // Check if session has expired
    if (isSessionExpired(session)) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Save session data to file
 */
export async function saveSession(cwd: string, session: SessionData): Promise<void> {
  const sessionPath = getSessionPath(cwd);
  const content = JSON.stringify(session, null, 2);
  await fs.writeFile(sessionPath, content, 'utf-8');
}

/**
 * Delete session file
 */
export async function deleteSession(cwd: string): Promise<void> {
  const sessionPath = getSessionPath(cwd);
  try {
    await fs.unlink(sessionPath);
  } catch {
    // File doesn't exist, that's fine
  }
}

/**
 * Check if a session has expired (24 hours)
 */
export function isSessionExpired(session: SessionData): boolean {
  const referenceTime = session.pausedAt || session.startedAt;
  const elapsed = Date.now() - new Date(referenceTime).getTime();
  return elapsed >= SESSION_EXPIRY_MS;
}

/**
 * Create a new session
 */
export function createSession(params: {
  task: string;
  maxIterations: number;
  cwd: string;
  agentName: string;
  options: SessionOptions;
}): SessionData {
  return {
    id: generateSessionId(),
    startedAt: new Date().toISOString(),
    task: params.task,
    currentIteration: 0,
    maxIterations: params.maxIterations,
    state: 'running',
    checkpoint: {},
    options: params.options,
    commits: [],
    cwd: params.cwd,
    agentName: params.agentName,
  };
}

/**
 * Update session with new iteration state
 */
export function updateSessionIteration(
  session: SessionData,
  iteration: number,
  checkpoint: Partial<SessionCheckpoint>
): SessionData {
  return {
    ...session,
    currentIteration: iteration,
    checkpoint: {
      ...session.checkpoint,
      ...checkpoint,
    },
  };
}

/**
 * Pause a running session
 */
export async function pauseSession(cwd: string): Promise<SessionData | null> {
  const session = await loadSession(cwd);

  if (!session) {
    return null;
  }

  if (session.state !== 'running') {
    return null;
  }

  const pausedSession: SessionData = {
    ...session,
    state: 'paused',
    pausedAt: new Date().toISOString(),
  };

  await saveSession(cwd, pausedSession);
  return pausedSession;
}

/**
 * Resume a paused session
 */
export async function resumeSession(cwd: string): Promise<SessionData | null> {
  const session = await loadSession(cwd);

  if (!session) {
    return null;
  }

  if (session.state !== 'paused') {
    return null;
  }

  // Check if session has expired
  if (isSessionExpired(session)) {
    await deleteSession(cwd);
    return null;
  }

  const resumedSession: SessionData = {
    ...session,
    state: 'running',
    resumedAt: new Date().toISOString(),
  };

  await saveSession(cwd, resumedSession);
  return resumedSession;
}

/**
 * Mark session as completed and clean up
 */
export async function completeSession(cwd: string): Promise<void> {
  const session = await loadSession(cwd);

  if (session) {
    // Save final state before deletion for debugging/history
    const completedSession: SessionData = {
      ...session,
      state: 'completed',
    };

    // We could optionally save to a history file here
    // For now, just delete the session
    await deleteSession(cwd);
  }
}

/**
 * Mark session as failed
 */
export async function failSession(cwd: string, error?: string): Promise<void> {
  const session = await loadSession(cwd);

  if (session) {
    const failedSession: SessionData = {
      ...session,
      state: 'failed',
      checkpoint: {
        ...session.checkpoint,
        lastOutput: error,
      },
    };

    await saveSession(cwd, failedSession);
  }
}

/**
 * Add a commit to the session
 */
export function addSessionCommit(session: SessionData, commitMsg: string): SessionData {
  return {
    ...session,
    commits: [...session.commits, commitMsg],
    checkpoint: {
      ...session.checkpoint,
      lastCommit: commitMsg,
    },
  };
}

/**
 * Get session status info for display
 */
export function getSessionStatus(session: SessionData): {
  state: SessionState;
  progress: string;
  elapsed: string;
  isExpired: boolean;
} {
  const isExpired = isSessionExpired(session);

  const startTime = new Date(session.startedAt).getTime();
  const now = Date.now();
  const elapsedMs = now - startTime;

  const minutes = Math.floor(elapsedMs / 60000);
  const hours = Math.floor(minutes / 60);

  let elapsed: string;
  if (hours > 0) {
    elapsed = `${hours}h ${minutes % 60}m`;
  } else {
    elapsed = `${minutes}m`;
  }

  const progress = `${session.currentIteration}/${session.maxIterations} iterations`;

  return {
    state: session.state,
    progress,
    elapsed,
    isExpired,
  };
}

/**
 * Format session info for CLI display
 */
export function formatSessionInfo(session: SessionData): string[] {
  const status = getSessionStatus(session);
  const lines: string[] = [];

  lines.push(`Session ID: ${session.id.slice(0, 8)}`);
  lines.push(`State: ${status.state}${status.isExpired ? ' (expired)' : ''}`);
  lines.push(`Task: ${session.task.slice(0, 60)}${session.task.length > 60 ? '...' : ''}`);
  lines.push(`Progress: ${status.progress}`);
  lines.push(`Elapsed: ${status.elapsed}`);
  lines.push(`Agent: ${session.agentName}`);

  if (session.commits.length > 0) {
    lines.push(`Commits: ${session.commits.length}`);
  }

  if (session.pausedAt) {
    lines.push(`Paused: ${new Date(session.pausedAt).toLocaleString()}`);
  }

  return lines;
}

/**
 * Session manager class for convenient session handling during loop execution
 */
export class SessionManager {
  private session: SessionData | null = null;
  private cwd: string;

  constructor(cwd: string) {
    this.cwd = cwd;
  }

  /**
   * Start a new session or resume an existing one
   */
  async start(params: {
    task: string;
    maxIterations: number;
    agentName: string;
    options: SessionOptions;
    forceNew?: boolean;
  }): Promise<{ session: SessionData; resumed: boolean }> {
    // Check for existing session
    if (!params.forceNew) {
      const existing = await loadSession(this.cwd);
      if (existing && existing.state === 'paused' && !isSessionExpired(existing)) {
        // Resume existing session
        const resumed = await resumeSession(this.cwd);
        if (resumed) {
          this.session = resumed;
          return { session: resumed, resumed: true };
        }
      }
    }

    // Create new session
    this.session = createSession({
      task: params.task,
      maxIterations: params.maxIterations,
      cwd: this.cwd,
      agentName: params.agentName,
      options: params.options,
    });

    await saveSession(this.cwd, this.session);
    return { session: this.session, resumed: false };
  }

  /**
   * Update the current iteration
   */
  async updateIteration(iteration: number, checkpoint: Partial<SessionCheckpoint>): Promise<void> {
    if (!this.session) return;

    this.session = updateSessionIteration(this.session, iteration, checkpoint);
    await saveSession(this.cwd, this.session);
  }

  /**
   * Record a commit
   */
  async recordCommit(commitMsg: string): Promise<void> {
    if (!this.session) return;

    this.session = addSessionCommit(this.session, commitMsg);
    await saveSession(this.cwd, this.session);
  }

  /**
   * Pause the current session
   */
  async pause(): Promise<boolean> {
    if (!this.session || this.session.state !== 'running') return false;

    const paused = await pauseSession(this.cwd);
    if (paused) {
      this.session = paused;
      return true;
    }
    return false;
  }

  /**
   * Complete the session (cleanup)
   */
  async complete(): Promise<void> {
    await completeSession(this.cwd);
    this.session = null;
  }

  /**
   * Mark session as failed
   */
  async fail(error?: string): Promise<void> {
    await failSession(this.cwd, error);
    this.session = null;
  }

  /**
   * Get current session
   */
  getSession(): SessionData | null {
    return this.session;
  }

  /**
   * Get starting iteration (for resume)
   */
  getStartIteration(): number {
    return this.session?.currentIteration ?? 0;
  }

  /**
   * Get session commits
   */
  getCommits(): string[] {
    return this.session?.commits ?? [];
  }
}
