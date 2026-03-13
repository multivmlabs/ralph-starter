import { spawn } from 'node:child_process';
import chalk from 'chalk';
import { execa } from 'execa';

export type AgentType =
  | 'claude-code'
  | 'cursor'
  | 'codex'
  | 'opencode'
  | 'openclaw'
  | 'amp'
  | 'anthropic-sdk'
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
  /** API key for SDK-based agents (anthropic-sdk). Overrides env var. */
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
  unknown: {
    name: 'Unknown',
    command: '',
    checkCmd: [],
  },
};

export async function checkAgentAvailable(
  type: AgentType,
  options?: { apiKey?: string }
): Promise<boolean> {
  if (type === 'unknown') return false;
  if (type === 'anthropic-sdk') {
    return !!(options?.apiKey || process.env.ANTHROPIC_API_KEY);
  }

  const agent = AGENTS[type];
  try {
    await execa(agent.checkCmd[0], agent.checkCmd.slice(1), { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function detectAvailableAgents(options?: {
  apiKeys?: Record<string, string>;
}): Promise<Agent[]> {
  const entries = Object.entries(AGENTS).filter(([type]) => type !== 'unknown');

  // Check all agents in parallel — each spawns an independent subprocess
  const results = await Promise.all(
    entries.map(async ([type, config]) => ({
      type: type as AgentType,
      name: config.name,
      command: config.command,
      available: await checkAgentAvailable(type as AgentType, {
        apiKey:
          type === 'anthropic-sdk'
            ? options?.apiKeys?.ANTHROPIC_API_KEY || options?.apiKeys?.anthropic
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

  // Prefer Claude Code, then Amp, then Anthropic SDK, then others
  const preferred = [
    'claude-code',
    'amp',
    'anthropic-sdk',
    'cursor',
    'codex',
    'opencode',
    'openclaw',
  ];
  for (const type of preferred) {
    const agent = available.find((a) => a.type === type);
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
      // Prompt first
      args.push('-p', options.task);
      // Auto mode
      if (options.auto) {
        args.push('--dangerously-skip-permissions');
      }
      // Model override (e.g., 'claude-sonnet-4-5-20250929')
      if (options.model) {
        args.push('--model', options.model);
      }
      // Streaming JSONL output for real-time progress
      args.push('--verbose');
      args.push('--output-format', 'stream-json');
      // Turn limit
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
      // Use Amp SDK for native async generator integration when available,
      // fall back to CLI subprocess with --stream-json for compatibility.
      return runAmpAgent(agent, options);

    case 'anthropic-sdk':
      return runAnthropicSdkAgent(agent, options);

    default:
      throw new Error(`Unknown agent type: ${agent.type}`);
  }

  // Use spawn for real-time streaming with timeout
  return new Promise((resolve) => {
    // Debug: log the exact command being run
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
      // stdin: 'ignore' - we don't need stdin, and leaving it as 'pipe' without closing causes hangs!
      stdio: ['ignore', 'pipe', 'pipe'],
      env: options.env ? { ...process.env, ...options.env } : undefined,
    });

    let output = '';
    let outputBytes = 0;
    let stdoutBuffer = '';
    const maxOutputBytes = options.maxOutputBytes || 50 * 1024 * 1024; // Default 50MB

    // Track data timing for debugging and silence notifications
    let lastDataTime = Date.now();
    let silenceWarningShown = false;
    let extendedSilenceShown = false;

    // Notify if no data received for 30+ seconds (calm, non-alarming)
    // Skip in headless mode to avoid polluting SDK/CI output
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

    // Configurable timeout (default: 5 minutes)
    const timeoutMs = options.timeoutMs || 300000;
    const timeout = setTimeout(() => {
      if (silenceChecker) clearInterval(silenceChecker);
      if (process.env.RALPH_DEBUG) {
        console.error('[DEBUG] TIMEOUT reached after', timeoutMs, 'ms');
        console.error('[DEBUG] Output so far:', output.slice(-500));
      }
      proc.kill('SIGTERM');
      resolve({ output: output + '\nProcess timed out', exitCode: 124 });
    }, timeoutMs);

    // Process stdout line-by-line for real-time updates
    proc.stdout?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      outputBytes += data.byteLength;

      // Guard against unbounded memory growth — keep last portion if over limit.
      // Repeatable: no flag gate, so output stays bounded even with continuous streaming.
      if (outputBytes > maxOutputBytes) {
        const keepBytes = Math.floor(maxOutputBytes * 0.8);
        output = output.slice(-keepBytes);
        outputBytes = Buffer.byteLength(output); // Reset counter to actual buffer size
        if (process.env.RALPH_DEBUG) {
          console.error(
            `[DEBUG] Output exceeded ${maxOutputBytes} bytes, truncated to ~${outputBytes}`
          );
        }
      }

      output += chunk;
      stdoutBuffer += chunk;
      lastDataTime = Date.now();
      silenceWarningShown = false; // Reset warning flag when data received

      // Debug: log data timing
      if (process.env.RALPH_DEBUG) {
        console.error('[DEBUG] Data chunk received, length:', chunk.length);
      }

      // Split into lines and process complete ones
      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          // Call onOutput callback for each line (enables progress detection)
          if (options.onOutput) {
            options.onOutput(line);
          }
          // Optionally stream to console
          if (options.streamOutput) {
            process.stdout.write(chalk.dim(line + '\n'));
          }
        }
      }
    });

    proc.stderr?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      outputBytes += data.byteLength; // Include stderr in byte accounting
      output += chunk;
      // Debug: log stderr output
      if (process.env.RALPH_DEBUG) {
        console.error('[DEBUG] STDERR:', chunk.slice(0, 200));
      }
    });

    proc.on('close', (code: number | null) => {
      clearTimeout(timeout);
      if (silenceChecker) clearInterval(silenceChecker);
      // Debug: log process close
      if (process.env.RALPH_DEBUG) {
        console.error('[DEBUG] Process closed with code:', code);
        console.error('[DEBUG] Total output length:', output.length);
      }
      // Process any remaining buffer
      if (stdoutBuffer.trim()) {
        if (options.onOutput) {
          options.onOutput(stdoutBuffer);
        }
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

/**
 * Tool definitions for the Anthropic SDK agent — enables real file operations.
 */
const ANTHROPIC_SDK_TOOLS = [
  {
    name: 'read_file',
    description: 'Read the contents of a file at the given path (relative to working directory).',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'File path relative to working directory' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description:
      'Write content to a file, creating it if it does not exist or overwriting if it does. Creates parent directories as needed.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'File path relative to working directory' },
        content: { type: 'string', description: 'Full file content to write' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'list_directory',
    description: 'List files and directories at the given path (relative to working directory).',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'Directory path relative to working directory. Use "." for root.',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'run_command',
    description:
      'Execute a shell command in the working directory. Use for installing dependencies, running tests, git operations, etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        command: { type: 'string', description: 'Shell command to execute' },
      },
      required: ['command'],
    },
  },
];

/**
 * Execute a tool call from the Anthropic SDK agent.
 */
async function executeAnthropicTool(
  toolName: string,
  input: Record<string, string>,
  cwd: string,
  allowShellExecution: boolean
): Promise<string> {
  const { readFileSync, writeFileSync, readdirSync, mkdirSync, statSync, realpathSync } =
    await import('node:fs');
  const { join, dirname, resolve } = await import('node:path');
  const { execSync } = await import('node:child_process');

  // Prevent path traversal: resolved path must stay within cwd
  const safePath = (p: string): string => {
    const resolved = resolve(cwd, p);
    // Use realpath for cwd (which always exists) and compare with the resolved target.
    // For new files that don't exist yet, check the resolved absolute path prefix.
    const realCwd = realpathSync(cwd);
    try {
      const realResolved = realpathSync(resolved);
      if (!realResolved.startsWith(realCwd)) {
        throw new Error(`Path traversal not allowed: ${p}`);
      }
      return realResolved;
    } catch (e) {
      // File may not exist yet (write_file) — verify the resolved path prefix
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        if (!resolved.startsWith(realCwd)) {
          throw new Error(`Path traversal not allowed: ${p}`);
        }
        return resolved;
      }
      throw e;
    }
  };

  switch (toolName) {
    case 'read_file': {
      try {
        return readFileSync(safePath(input.path), 'utf-8');
      } catch (e) {
        return `Error reading file: ${e instanceof Error ? e.message : e}`;
      }
    }
    case 'write_file': {
      try {
        const fullPath = safePath(input.path);
        mkdirSync(dirname(fullPath), { recursive: true });
        writeFileSync(fullPath, input.content, 'utf-8');
        return `File written: ${input.path}`;
      } catch (e) {
        return `Error writing file: ${e instanceof Error ? e.message : e}`;
      }
    }
    case 'list_directory': {
      try {
        const fullPath = safePath(input.path);
        const entries = readdirSync(fullPath);
        return entries
          .map((name: string) => {
            try {
              const s = statSync(join(fullPath, name));
              return s.isDirectory() ? `${name}/` : name;
            } catch {
              return name;
            }
          })
          .join('\n');
      } catch (e) {
        return `Error listing directory: ${e instanceof Error ? e.message : e}`;
      }
    }
    case 'run_command': {
      if (!allowShellExecution) {
        return 'Error: Shell execution is disabled. Set allowShellExecution: true to enable.';
      }
      try {
        const result = execSync(input.command, {
          cwd,
          encoding: 'utf-8',
          timeout: 60000,
          maxBuffer: 10 * 1024 * 1024,
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        return result || '(command completed with no output)';
      } catch (e: unknown) {
        const err = e as { stdout?: string; stderr?: string; message?: string };
        return `Command failed:\n${err.stderr || err.stdout || err.message || e}`;
      }
    }
    default:
      return `Unknown tool: ${toolName}`;
  }
}

/**
 * Run Anthropic SDK agent — uses @anthropic-ai/sdk directly (no CLI binary needed).
 * Implements a multi-turn tool-use loop for real file operations.
 * Suitable for web applications and environments without CLI tools installed.
 */
async function runAnthropicSdkAgent(
  _agent: Agent,
  options: AgentRunOptions
): Promise<{ output: string; exitCode: number }> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;

  const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      output: 'No Anthropic API key provided. Set ANTHROPIC_API_KEY or pass apiKey option.',
      exitCode: 1,
    };
  }

  const client = new Anthropic({ apiKey });
  const model = options.model || 'claude-sonnet-4-20250514';

  const allowShell = options.allowShellExecution ?? false;
  const tools = allowShell
    ? ANTHROPIC_SDK_TOOLS
    : ANTHROPIC_SDK_TOOLS.filter((t) => t.name !== 'run_command');

  const systemPrompt = [
    `You are an expert software engineer. You have tools to read/write files${allowShell ? ' and run commands' : ''}.`,
    `Working directory: ${options.cwd}`,
    'Use the provided tools to complete the task. Be thorough, write clean code, and handle edge cases.',
    'When finished, provide a summary of what you did.',
  ].join('\n');

  let output = '';
  let outputBytes = 0;
  const maxOutputBytes = options.maxOutputBytes || 50 * 1024 * 1024;
  const maxTurns = options.maxTurns || 50;
  const startTime = Date.now();
  const timeoutMs = options.timeoutMs || 600000; // 10 min default for tool-use loops

  type Message = { role: 'user' | 'assistant'; content: string | ContentBlock[] };
  type ContentBlock =
    | { type: 'text'; text: string }
    | { type: 'tool_use'; id: string; name: string; input: Record<string, string> }
    | { type: 'tool_result'; tool_use_id: string; content: string };

  const messages: Message[] = [{ role: 'user', content: options.task }];

  // Buffer partial lines so onOutput always receives complete lines (matching CLI agents)
  let lineBuffer = '';

  const appendOutput = (text: string) => {
    output += text;
    outputBytes += Buffer.byteLength(text);
    if (options.streamOutput) process.stdout.write(text);
    if (outputBytes > maxOutputBytes) {
      const keepBytes = Math.floor(maxOutputBytes * 0.8);
      output = output.slice(-keepBytes);
      outputBytes = Buffer.byteLength(output);
    }
    if (options.onOutput) {
      lineBuffer += text;
      const lines = lineBuffer.split('\n');
      lineBuffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line) options.onOutput(line);
      }
    }
  };

  const flushLineBuffer = () => {
    if (lineBuffer && options.onOutput) {
      options.onOutput(lineBuffer);
      lineBuffer = '';
    }
  };

  try {
    for (let turn = 0; turn < maxTurns; turn++) {
      if (Date.now() - startTime > timeoutMs) {
        appendOutput('\nAgent timed out.');
        return { output, exitCode: 124 };
      }

      const elapsed = Date.now() - startTime;
      const remaining = timeoutMs - elapsed;
      const requestOptions = remaining > 0 ? { timeout: remaining } : {};

      const response = await client.messages.create(
        {
          model,
          max_tokens: 16384,
          system: systemPrompt,
          messages: messages as Parameters<typeof client.messages.create>[0]['messages'],
          tools,
        },
        requestOptions
      );

      // Collect text output and tool calls from response
      const toolCalls: Array<{ id: string; name: string; input: Record<string, string> }> = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          appendOutput(block.text);
        } else if (block.type === 'tool_use') {
          appendOutput(`\n[tool: ${block.name}(${JSON.stringify(block.input).slice(0, 100)})]\n`);
          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input as Record<string, string>,
          });
        }
      }

      // If no tool calls or stop_reason is "end_turn", we're done
      if (toolCalls.length === 0 || response.stop_reason === 'end_turn') {
        break;
      }

      // Add assistant message to history
      messages.push({ role: 'assistant', content: response.content as ContentBlock[] });

      // Execute tool calls and add results
      const toolResults: ContentBlock[] = [];
      for (const call of toolCalls) {
        const result = await executeAnthropicTool(call.name, call.input, options.cwd, allowShell);
        const truncated =
          result.length > 50000 ? `${result.slice(0, 50000)}\n...(truncated)` : result;
        appendOutput(
          `[result: ${truncated.slice(0, 200)}${truncated.length > 200 ? '...' : ''}]\n`
        );
        toolResults.push({
          type: 'tool_result',
          tool_use_id: call.id,
          content: truncated,
        });
      }

      messages.push({ role: 'user', content: toolResults });
    }

    flushLineBuffer();
    return { output, exitCode: 0 };
  } catch (error) {
    flushLineBuffer();
    const msg = error instanceof Error ? error.message : String(error);
    return { output: `${output}\nError: ${msg}`, exitCode: 1 };
  }
}

/**
 * Run Amp agent using the @sourcegraph/amp-sdk for native TypeScript integration.
 * Provides structured message streaming, cancellation, and multi-turn support.
 */
async function runAmpAgent(
  agent: Agent,
  options: AgentRunOptions
): Promise<{ output: string; exitCode: number }> {
  let ampSdk: typeof import('@sourcegraph/amp-sdk');
  try {
    ampSdk = await import('@sourcegraph/amp-sdk');
  } catch {
    // SDK not available — fall back to CLI subprocess
    return runAmpCli(agent, options);
  }

  const sdkOptions: Parameters<typeof ampSdk.execute>[0] = {
    prompt: options.task,
    options: {
      cwd: options.cwd,
      dangerouslyAllowAll: options.auto ?? false,
      mode: options.ampMode ?? 'smart',
      env: options.env,
    },
  };

  if (options.timeoutMs) {
    sdkOptions.signal = AbortSignal.timeout(options.timeoutMs);
  }

  let output = '';
  let outputBytes = 0;
  const maxOutputBytes = options.maxOutputBytes || 50 * 1024 * 1024;
  let lastResult = '';

  try {
    for await (const message of ampSdk.execute(sdkOptions)) {
      const line = JSON.stringify(message);

      if (options.onOutput) {
        options.onOutput(line);
      }
      if (options.streamOutput) {
        process.stdout.write(chalk.dim(`${line}\n`));
      }

      const lineStr = `${line}\n`;
      output += lineStr;
      outputBytes += Buffer.byteLength(lineStr);

      if (outputBytes > maxOutputBytes) {
        const keepBytes = Math.floor(maxOutputBytes * 0.8);
        output = output.slice(-keepBytes);
        outputBytes = Buffer.byteLength(output);
      }

      if (message.type === 'assistant' && message.message?.content) {
        for (const block of message.message.content) {
          if ('text' in block && block.text) {
            lastResult = block.text;
          }
        }
      }

      if (message.type === 'result') {
        if (message.is_error) {
          return { output: output + (message.error ?? ''), exitCode: 1 };
        }
        lastResult = message.result ?? lastResult;
      }
    }

    return { output: output || lastResult, exitCode: 0 };
  } catch (error) {
    const isTimeout =
      error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    const msg = error instanceof Error ? error.message : String(error);
    return { output: `${output}\n${msg}`, exitCode: isTimeout ? 124 : 1 };
  }
}

/**
 * CLI fallback for Amp when SDK is not installed.
 * Uses `amp --execute --stream-json --dangerously-allow-all`.
 */
function runAmpCli(
  agent: Agent,
  options: AgentRunOptions
): Promise<{ output: string; exitCode: number }> {
  const args = ['--execute', options.task, '--stream-json'];

  if (options.auto) {
    args.push('--dangerously-allow-all');
  }

  if (options.ampMode) {
    args.push('--mode', options.ampMode);
  }

  // Re-use the standard subprocess runner by calling runAgent with a patched agent
  // that doesn't hit the 'amp' case again. Instead, we inline the spawn logic.
  return new Promise((resolve) => {
    const proc = spawn(agent.command, args, {
      cwd: options.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: options.env ? { ...process.env, ...options.env } : undefined,
    });

    let output = '';
    let outputBytes = 0;
    let stdoutBuffer = '';
    const maxOutputBytes = options.maxOutputBytes || 50 * 1024 * 1024;

    const timeoutMs = options.timeoutMs || 300000;
    const timeout = setTimeout(() => {
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
      }

      output += chunk;
      stdoutBuffer += chunk;

      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          if (options.onOutput) options.onOutput(line);
          if (options.streamOutput) process.stdout.write(chalk.dim(`${line}\n`));
        }
      }
    });

    proc.stderr?.on('data', (data: Buffer) => {
      output += data.toString();
    });

    proc.on('close', (code: number | null) => {
      clearTimeout(timeout);
      if (stdoutBuffer.trim() && options.onOutput) {
        options.onOutput(stdoutBuffer);
      }
      resolve({ output, exitCode: code ?? 0 });
    });

    proc.on('error', (err: Error) => {
      clearTimeout(timeout);
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
