import { spawn } from 'node:child_process';
import chalk from 'chalk';
import type { Agent, AgentRunOptions } from '../agents.js';

export async function runAmpAgent(
  agent: Agent,
  options: AgentRunOptions
): Promise<{ output: string; exitCode: number }> {
  let ampSdk: typeof import('@sourcegraph/amp-sdk');
  try {
    ampSdk = await import('@sourcegraph/amp-sdk');
  } catch {
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
    const message = error instanceof Error ? error.message : String(error);
    return { output: `${output}\n${message}`, exitCode: isTimeout ? 124 : 1 };
  }
}

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
