import type { Agent, AgentRunOptions } from '../agents.js';
import { createOutputCollector } from './output-collector.js';

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

function requiredString(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required string input: ${key}`);
  }
  return value;
}

async function executeAnthropicTool(
  toolName: string,
  input: Record<string, unknown>,
  cwd: string,
  allowShellExecution: boolean
): Promise<string> {
  const { readFileSync, writeFileSync, readdirSync, mkdirSync, statSync, realpathSync } =
    await import('node:fs');
  const { dirname, join, resolve, sep } = await import('node:path');
  const { execSync } = await import('node:child_process');

  const realCwd = realpathSync(cwd);
  const isWithinRoot = (targetPath: string) =>
    targetPath === realCwd || targetPath.startsWith(`${realCwd}${sep}`);

  const safePath = (relativePath: string): string => {
    const resolved = resolve(cwd, relativePath);

    try {
      const realResolved = realpathSync(resolved);
      if (!isWithinRoot(realResolved)) {
        throw new Error(`Path traversal not allowed: ${relativePath}`);
      }
      return realResolved;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        if (!isWithinRoot(resolved)) {
          throw new Error(`Path traversal not allowed: ${relativePath}`);
        }
        return resolved;
      }
      throw error;
    }
  };

  switch (toolName) {
    case 'read_file': {
      try {
        const path = requiredString(input, 'path');
        return readFileSync(safePath(path), 'utf-8');
      } catch (error) {
        return `Error reading file: ${error instanceof Error ? error.message : String(error)}`;
      }
    }

    case 'write_file': {
      try {
        const path = requiredString(input, 'path');
        const content = requiredString(input, 'content');
        const fullPath = safePath(path);
        mkdirSync(dirname(fullPath), { recursive: true });
        writeFileSync(fullPath, content, 'utf-8');
        return `File written: ${path}`;
      } catch (error) {
        return `Error writing file: ${error instanceof Error ? error.message : String(error)}`;
      }
    }

    case 'list_directory': {
      try {
        const path = typeof input.path === 'string' && input.path.length > 0 ? input.path : '.';
        const fullPath = safePath(path);
        const entries = readdirSync(fullPath);
        return entries
          .map((entry) => {
            try {
              const stats = statSync(join(fullPath, entry));
              return stats.isDirectory() ? `${entry}/` : entry;
            } catch {
              return entry;
            }
          })
          .join('\n');
      } catch (error) {
        return `Error listing directory: ${error instanceof Error ? error.message : String(error)}`;
      }
    }

    case 'run_command': {
      if (!allowShellExecution) {
        return 'Error: Shell execution is disabled. Set allowShellExecution: true to enable.';
      }

      try {
        const command = requiredString(input, 'command');
        const result = execSync(command, {
          cwd,
          encoding: 'utf-8',
          timeout: 60000,
          maxBuffer: 10 * 1024 * 1024,
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        return result || '(command completed with no output)';
      } catch (error) {
        const err = error as { stdout?: string; stderr?: string; message?: string };
        return `Command failed:\n${err.stderr || err.stdout || err.message || String(error)}`;
      }
    }

    default:
      return `Unknown tool: ${toolName}`;
  }
}

export async function runAnthropicSdkAgent(
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
    : ANTHROPIC_SDK_TOOLS.filter((tool) => tool.name !== 'run_command');

  const systemPrompt = [
    `You are an expert software engineer. You have tools to read/write files${allowShell ? ' and run commands' : ''}.`,
    `Working directory: ${options.cwd}`,
    'Use the provided tools to complete the task. Be thorough, write clean code, and handle edge cases.',
    'When finished, provide a summary of what you did.',
  ].join('\n');

  type ContentBlock =
    | { type: 'text'; text: string }
    | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
    | { type: 'tool_result'; tool_use_id: string; content: string };

  const maxTurns = options.maxTurns || 50;
  const timeoutMs = options.timeoutMs || 600000;
  const startedAt = Date.now();
  const messages: Array<{ role: 'user' | 'assistant'; content: string | ContentBlock[] }> = [
    { role: 'user', content: options.task },
  ];
  const output = createOutputCollector(options);

  try {
    for (let turn = 0; turn < maxTurns; turn++) {
      if (Date.now() - startedAt > timeoutMs) {
        output.append('\nAgent timed out.');
        output.flush();
        return { output: output.getOutput(), exitCode: 124 };
      }

      const elapsed = Date.now() - startedAt;
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

      const toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          output.append(block.text);
        } else if (block.type === 'tool_use') {
          output.append(`\n[tool: ${block.name}(${JSON.stringify(block.input).slice(0, 100)})]\n`);
          toolCalls.push({
            id: block.id,
            name: block.name,
            input: (block.input || {}) as Record<string, unknown>,
          });
        }
      }

      if (toolCalls.length === 0) {
        break;
      }

      messages.push({ role: 'assistant', content: response.content as ContentBlock[] });

      const toolResults: ContentBlock[] = [];
      for (const call of toolCalls) {
        const result = await executeAnthropicTool(call.name, call.input, options.cwd, allowShell);
        const truncated =
          result.length > 50000 ? `${result.slice(0, 50000)}\n...(truncated)` : result;

        output.append(
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

    output.flush();
    return { output: output.getOutput(), exitCode: 0 };
  } catch (error) {
    output.flush();
    const message = error instanceof Error ? error.message : String(error);
    const prefix = output.getOutput();
    return {
      output: `${prefix}${prefix ? '\n' : ''}Error: ${message}`,
      exitCode: 1,
    };
  }
}
