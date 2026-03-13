import type { Agent, AgentRunOptions } from '../agents.js';
import { createOutputCollector } from './output-collector.js';

function parseProviderModel(
  model: string | undefined
): { providerID: string; modelID: string } | undefined {
  if (!model) return undefined;

  const slashIndex = model.indexOf('/');
  if (slashIndex <= 0 || slashIndex >= model.length - 1) {
    return undefined;
  }

  return {
    providerID: model.slice(0, slashIndex),
    modelID: model.slice(slashIndex + 1),
  };
}

export async function runOpencodeSdkAgent(
  _agent: Agent,
  options: AgentRunOptions
): Promise<{ output: string; exitCode: number }> {
  const apiKey = options.apiKey || process.env.OPENCODE_API_KEY;
  if (!apiKey) {
    return {
      output: 'No OpenCode API key provided. Set OPENCODE_API_KEY or pass apiKey option.',
      exitCode: 1,
    };
  }

  const output = createOutputCollector(options);
  const timeoutMs = options.timeoutMs || 600000;
  const model = parseProviderModel(options.model);

  if (options.model && !model) {
    output.append(
      `[warn] opencode-sdk requires model in "providerID/modelID" format (got: "${options.model}"). Using server default.\n`
    );
  }

  const controller = new AbortController();

  let timeoutHandle: NodeJS.Timeout | undefined;
  let server: { close: () => void } | null = null;

  try {
    timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    const { createOpencode } = await import('@opencode-ai/sdk');
    const { client, server: opencodeServer } = await createOpencode({
      signal: controller.signal,
      config: {
        share: 'disabled',
        ...(model ? { model: `${model.providerID}/${model.modelID}` } : {}),
        provider: {
          opencode: {
            options: {
              apiKey,
            },
          },
        },
      },
    });
    server = opencodeServer;

    // Best-effort auth setup; some environments will already be authenticated via config/env.
    try {
      await client.auth.set({
        path: { id: 'opencode' },
        body: { type: 'api', key: apiKey },
        signal: controller.signal,
      });
    } catch {
      // Ignore auth bootstrap errors and continue — prompt call will surface auth failures if needed.
    }

    const sessionResponse = await client.session.create({
      body: { title: 'Ralph Starter Session' },
      query: { directory: options.cwd },
      signal: controller.signal,
    });

    const sessionID = sessionResponse.data?.id;
    if (!sessionID) {
      throw new Error('OpenCode SDK did not return a session id.');
    }

    const promptBody: {
      parts: Array<{ type: 'text'; text: string }>;
      system: string;
      model?: { providerID: string; modelID: string };
    } = {
      parts: [{ type: 'text', text: options.task }],
      system: `You are an expert software engineer. Working directory: ${options.cwd}`,
    };

    if (model) {
      promptBody.model = model;
    }

    const promptResponse = await client.session.prompt({
      path: { id: sessionID },
      query: { directory: options.cwd },
      body: promptBody,
      signal: controller.signal,
    });

    let hasVisibleOutput = false;

    for (const part of promptResponse.data?.parts ?? []) {
      if ((part.type === 'text' || part.type === 'reasoning') && part.text) {
        output.append(part.text);
        hasVisibleOutput = true;
      }

      if (part.type === 'tool') {
        if (part.state.status === 'completed') {
          output.append(`\n[tool:${part.tool}] ${part.state.title}\n`);
          hasVisibleOutput = true;
        }

        if (part.state.status === 'error') {
          output.append(`\n[tool:${part.tool} error] ${part.state.error}\n`);
          hasVisibleOutput = true;
        }
      }
    }

    if (!hasVisibleOutput) {
      output.append('OpenCode SDK completed without textual output.\n');
    }

    output.flush();
    return { output: output.getOutput(), exitCode: 0 };
  } catch (error) {
    output.flush();
    const message = error instanceof Error ? error.message : String(error);
    const isTimeout =
      controller.signal.aborted || /abort|timeout|timed out/i.test(message.toLowerCase());
    const prefix = output.getOutput();

    return {
      output: `${prefix}${prefix ? '\n' : ''}Error: ${message}`,
      exitCode: isTimeout ? 124 : 1,
    };
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
    server?.close();
  }
}
