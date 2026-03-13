import { spawn } from 'node:child_process';
import chalk from 'chalk';
import { execa } from 'execa';
import { runAmpAgent } from './agents/amp-sdk.js';
import { runAnthropicSdkAgent } from './agents/anthropic-sdk.js';
import { runOpencodeSdkAgent } from './agents/opencode-sdk.js';

export type AgentType =
  | 'claude-code'
  | 'cursor'
  | 'codex'
  | 'opencode'
  | 'openclaw'
  | 'amp'
  | 'anthropic-sdk'
  | 'opencode-sdk'
  | 'unknown';

/** Amp agent mode — controls model selection and reasoning depth */
export type AmpMode = 'smart' | 'rush' | 'deep';

export type Agent = {
  type: AgentType;
  name: string;
  command: string;
  available: boolean;
};

export type AgentRunOptions = {
  task: string;
  cwd: string;
  auto?: boolean;
  maxTurns?: number;
  /** Model to use (e.g., 'claude-sonnet-4-5-20250929'). Passed via --model to supported agents. */
  model?: string;
  /** Stream output to console in real-time */
  streamOutput?: boolean;
  /** Callback for each line of output */
  onOutput?: (line: string) => void;
  /** Agent timeout in milliseconds (default: 300000 = 5 min) */
  timeoutMs?: number;
  /** Maximum output size in bytes before truncating (default: 50MB) */
  maxOutputBytes?: number;
  /** Additional environment variables to pass to the agent subprocess */
  env?: Record<string, string>;
  /** Suppress all console output (for SDK/CI usage) */
  headless?: boolean;
  /** Amp agent mode: smart (frontier), rush (fast), deep (extended reasoning) */
  ampMode?: AmpMode;
  /** API key for SDK-based agents (anthropic-sdk, opencode-sdk). Overrides env vars. */
  apiKey?: string;
  /** Allow the anthropic-sdk agent to execute shell commands. Disabled by default for safety. */
  allowShellExecution?: boolean;
};

const AGENTS: Record<AgentType, { name: string; command: string; checkCmd: string[] }> = {
  'claude-code': {
    name: 'Claude Code',
    command: 'claude',
    checkCmd: ['claude', '--version'],
  },
  cursor: {
    name: 'Cursor',
    command: 'cursor',
    checkCmd: ['cursor', '--version'],
  },
  codex: {
    name: 'Codex CLI',
    command: 'codex',
    checkCmd: ['codex', '--version'],
  },
  opencode: {
    name: 'OpenCode',
    command: 'opencode',
    checkCmd: ['opencode', '--version'],
  },
  openclaw: {
    name: 'OpenClaw',
    command: 'openclaw',
    checkCmd: ['openclaw', '--version'],
  },
  amp: {
    name: 'Amp',
    command: 'amp',
    checkCmd: ['amp', '--version'],
  },
  'anthropic-sdk': {
    name: 'Anthropic SDK',
    command: '',
    checkCmd: [],
  },
  'opencode-sdk': {
    name: 'OpenCode SDK',
    command: '',
    checkCmd: [],
  },
  unknown: {
    name: 'Unknown',
    command: '',
    checkCmd: [],
  },
};

async function checkCommandAvailable(command: string, args: string[]): Promise<boolean> {
  try {
    await execa(command, args, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function checkAgentAvailable(
  type: AgentType,
  options?: { apiKey?: string }
): Promise<boolean> {
  if (type === 'unknown') return false;

  if (type === 'anthropic-sdk') {
    return !!(options?.apiKey || process.env.ANTHROPIC_API_KEY);
  }

  if (type === 'opencode-sdk') {
    // OpenCode SDK starts a local opencode server under the hood, so the CLI binary must exist.
    // Auth may come from API keys or existing local OpenCode auth state.
    const checkCmd = AGENTS.opencode.checkCmd;
    return checkCommandAvailable(checkCmd[0], checkCmd.slice(1));
  }

  const agent = AGENTS[type];
  if (agent.checkCmd.length === 0) return false;
  return checkCommandAvailable(agent.checkCmd[0], agent.checkCmd.slice(1));
}

export async function detectAvailableAgents(options?: {
  apiKeys?: Record<string, string>;
}): Promise<Agent[]> {
  const entries = Object.entries(AGENTS).filter(([type]) => type !== 'unknown');

  const results = await Promise.all(
    entries.map(async ([type, config]) => ({
      type: type as AgentType,
      name: config.name,
      command: config.command,
      available: await checkAgentAvailable(type as AgentType, {
        apiKey:
          type === 'anthropic-sdk'
            ? options?.apiKeys?.ANTHROPIC_API_KEY || options?.apiKeys?.anthropic
            : type === 'opencode-sdk'
              ? options?.apiKeys?.OPENCODE_API_KEY || options?.apiKeys?.opencode
              : undefined,
      }),
    }))
  );

  return results;
}

export async function detectBestAgent(options?: {
  apiKeys?: Record<string, string>;
}): Promise<Agent | null> {
  const agents = await detectAvailableAgents(options);
  const available = agents.filter((a) => a.available);

  if (available.length === 0) return null;

  // Prefer Claude Code, then Amp, then SDK agents, then other CLIs.
  const preferred: AgentType[] = [
    'claude-code',
    'amp',
    'anthropic-sdk',
    'opencode-sdk',
    'cursor',
    'codex',
    'opencode',
    'openclaw',
  ];

  for (const type of preferred) {
    const agent = available.find((candidate) => candidate.type === type);
    if (agent) return agent;
  }

  return available[0];
}

export async function runAgent(
  agent: Agent,
  options: AgentRunOptions
): Promise<{ output: string; exitCode: number }> {
  const args: string[] = [];

  switch (agent.type) {
    case 'claude-code':
      args.push('-p', options.task);
      if (options.auto) {
        args.push('--dangerously-skip-permissions');
      }
      if (options.model) {
        args.push('--model', options.model);
      }
      args.push('--verbose');
      args.push('--output-format', 'stream-json');
      if (options.maxTurns) {
        args.push('--max-turns', String(options.maxTurns));
      }
      break;

    case 'cursor':
      args.push('--agent', options.task);
      break;

    case 'codex':
      args.push('-p', options.task);
      if (options.auto) {
        args.push('--auto-approve');
      }
      break;

    case 'opencode':
      args.push('-p', options.task);
      if (options.auto) {
        args.push('--auto');
      }
      break;

    case 'openclaw':
      args.push('agent', '--message', options.task);
      if (options.timeoutMs) {
        args.push('--timeout', String(Math.floor(options.timeoutMs / 1000)));
      }
      break;

    case 'amp':
      return runAmpAgent(agent, options);

    case 'anthropic-sdk':
      return runAnthropicSdkAgent(agent, options);

    case 'opencode-sdk':
      return runOpencodeSdkAgent(agent, options);

    default:
      throw new Error(`Unknown agent type: ${agent.type}`);
  }

  return runSubprocessAgent(agent, args, options);
}

function runSubprocessAgent(
  agent: Agent,
  args: string[],
  options: AgentRunOptions
): Promise<{ output: string; exitCode: number }> {
  return new Promise((resolve) => {
    if (process.env.RALPH_DEBUG) {
      console.error('\n[DEBUG] === SPAWNING AGENT ===');
      console.error('[DEBUG] Command:', agent.command);
      console.error(
        '[DEBUG] Args:',
        args.map((a) => (a.length > 100 ? a.slice(0, 100) + '...' : a))
      );
      console.error('[DEBUG] CWD:', options.cwd);
    }

    const proc = spawn(agent.command, args, {
      cwd: options.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: options.env ? { ...process.env, ...options.env } : undefined,
    });

    let output = '';
    let outputBytes = 0;
    let stdoutBuffer = '';
    const maxOutputBytes = options.maxOutputBytes || 50 * 1024 * 1024;

    let lastDataTime = Date.now();
    let silenceWarningShown = false;
    let extendedSilenceShown = false;

    const silenceChecker = options.headless
      ? undefined
      : setInterval(() => {
          const silentMs = Date.now() - lastDataTime;
          if (silentMs > 60000 && !extendedSilenceShown) {
            extendedSilenceShown = true;
            console.log(chalk.dim('  Still working... Use RALPH_DEBUG=1 for verbose output.'));
          } else if (silentMs > 30000 && !silenceWarningShown) {
            silenceWarningShown = true;
            console.log(
              chalk.dim(
                '\n  Agent is thinking... (no output for 30s, this is normal for complex tasks)'
              )
            );
          }
        }, 5000);

    const timeoutMs = options.timeoutMs || 300000;
    const timeout = setTimeout(() => {
      if (silenceChecker) clearInterval(silenceChecker);
      if (process.env.RALPH_DEBUG) {
        console.error('[DEBUG] TIMEOUT reached after', timeoutMs, 'ms');
        console.error('[DEBUG] Output so far:', output.slice(-500));
      }
      proc.kill('SIGTERM');
      resolve({ output: `${output}\nProcess timed out`, exitCode: 124 });
    }, timeoutMs);

    proc.stdout?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      outputBytes += data.byteLength;

      if (outputBytes > maxOutputBytes) {
        const keepBytes = Math.floor(maxOutputBytes * 0.8);
        output = output.slice(-keepBytes);
        outputBytes = Buffer.byteLength(output);
        if (process.env.RALPH_DEBUG) {
          console.error(
            `[DEBUG] Output exceeded ${maxOutputBytes} bytes, truncated to ~${outputBytes}`
          );
        }
      }

      output += chunk;
      stdoutBuffer += chunk;
      lastDataTime = Date.now();
      silenceWarningShown = false;

      if (process.env.RALPH_DEBUG) {
        console.error('[DEBUG] Data chunk received, length:', chunk.length);
      }

      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          if (options.onOutput) {
            options.onOutput(line);
          }
          if (options.streamOutput) {
            process.stdout.write(chalk.dim(`${line}\n`));
          }
        }
      }
    });

    proc.stderr?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      outputBytes += data.byteLength;
      output += chunk;
      if (process.env.RALPH_DEBUG) {
        console.error('[DEBUG] STDERR:', chunk.slice(0, 200));
      }
    });

    proc.on('close', (code: number | null) => {
      clearTimeout(timeout);
      if (silenceChecker) clearInterval(silenceChecker);
      if (process.env.RALPH_DEBUG) {
        console.error('[DEBUG] Process closed with code:', code);
        console.error('[DEBUG] Total output length:', output.length);
      }
      if (stdoutBuffer.trim() && options.onOutput) {
        options.onOutput(stdoutBuffer);
      }
      resolve({ output, exitCode: code ?? 0 });
    });

    proc.on('error', (err: Error) => {
      clearTimeout(timeout);
      if (silenceChecker) clearInterval(silenceChecker);
      resolve({ output: err.message, exitCode: 1 });
    });
  });
}

export function printAgentStatus(agents: Agent[]): void {
  console.log();
  console.log(chalk.cyan.bold('Available Agents:'));
  console.log();

  for (const agent of agents) {
    const status = agent.available ? chalk.green('✓ installed') : chalk.gray('✗ not found');
    console.log(`  ${agent.name.padEnd(15)} ${status}`);
  }
  console.log();
}
