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

function resolveProviderApiKey(
  providerID: string | undefined,
  options: AgentRunOptions
): string | undefined {
  if (options.apiKey) {
    return options.apiKey;
  }

  const env = options.env || {};

  switch (providerID) {
    case 'anthropic':
      return env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    case 'openai':
      return env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    case 'openrouter':
      return env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
    case 'opencode':
      return env.OPENCODE_API_KEY || process.env.OPENCODE_API_KEY;
    default:
      return undefined;
  }
}

export async function runOpencodeSdkAgent(
  _agent: Agent,
  options: AgentRunOptions
): Promise<{ output: string; exitCode: number }> {
  const output = createOutputCollector(options);
  const timeoutMs = options.timeoutMs || 600000;
  const model = parseProviderModel(options.model);
  const providerID = model?.providerID;
  const providerApiKey = resolveProviderApiKey(providerID, options);
  const authProviderID = providerID || (options.apiKey ? 'opencode' : undefined);

  if (options.model && !model) {
    output.append(
      `[warn] opencode-sdk requires model in "providerID/modelID" format (got: "${options.model}"). Using server default.\n`
    );
  }

  if (!providerID && options.apiKey) {
    output.append(
      '[warn] opencode-sdk: apiKey provided without --model; applying it to provider "opencode" as a best-effort fallback.\n'
    );
  }

  const controller = new AbortController();

  let timeoutHandle: NodeJS.Timeout | undefined;
  let server: { close: () => void } | null = null;

  try {
    timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    const { createOpencode } = await import('@opencode-ai/sdk');
    const providerConfig =
      authProviderID && providerApiKey
        ? {
            [authProviderID]: {
              options: {
                apiKey: providerApiKey,
              },
            },
          }
        : undefined;

    const { client, server: opencodeServer } = await createOpencode({
      signal: controller.signal,
      config: {
        share: 'disabled',
        ...(model ? { model: `${model.providerID}/${model.modelID}` } : {}),
        ...(providerConfig ? { provider: providerConfig } : {}),
      },
    });
    server = opencodeServer;

    // Best-effort auth setup for the resolved provider.
    if (authProviderID && providerApiKey) {
      try {
        await client.auth.set({
          path: { id: authProviderID },
          body: { type: 'api', key: providerApiKey },
          signal: controller.signal,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        output.append(`[warn] Failed to configure ${authProviderID} auth: ${message}\n`);
      }
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

    const promptBody: NonNullable<Parameters<typeof client.session.promptAsync>[0]['body']> = {
      parts: [{ type: 'text', text: options.task }],
      system: `You are an expert software engineer. Working directory: ${options.cwd}`,
    };

    if (model) {
      promptBody.model = model;
    }

    const eventSubscription = await client.event.subscribe({
      query: { directory: options.cwd },
      signal: controller.signal,
    });

    let sessionError = false;

    let hasVisibleOutput = false;

    const renderedTextPartIds = new Set<string>();
    const renderedToolPartIds = new Set<string>();

    // Guard stream errors so a promptAsync failure does not leave an unhandled rejection.
    const streamPromise = (async () => {
      for await (const event of eventSubscription.stream) {
        if (event.type === 'message.part.updated') {
          const { part, delta } = event.properties;
          if (part.sessionID !== sessionID) {
            continue;
          }

          if (part.type === 'text' || part.type === 'reasoning') {
            if (typeof delta === 'string' && delta.length > 0) {
              renderedTextPartIds.add(part.id);
              output.append(delta);
              hasVisibleOutput = true;
              continue;
            }

            if (part.text && !renderedTextPartIds.has(part.id)) {
              renderedTextPartIds.add(part.id);
              output.append(part.text);
              hasVisibleOutput = true;
            }
            continue;
          }

          if (part.type === 'tool') {
            if (renderedToolPartIds.has(part.id)) {
              continue;
            }

            const state = part.state;

            if (state?.status === 'completed') {
              renderedToolPartIds.add(part.id);
              output.append(`\n[tool:${part.tool}] ${state.title || part.tool}\n`);
              hasVisibleOutput = true;
              continue;
            }

            if (state?.status === 'error') {
              renderedToolPartIds.add(part.id);
              output.append(`\n[tool:${part.tool} error] ${state.error}\n`);
              hasVisibleOutput = true;
            }
          }
          continue;
        }

        if (event.type === 'session.error') {
          if (!event.properties.sessionID || event.properties.sessionID === sessionID) {
            const message =
              typeof event.properties.error?.data?.message === 'string'
                ? event.properties.error.data.message
                : 'Unknown session error';
            output.append(`\n[session.error] ${message}\n`);
            hasVisibleOutput = true;
            sessionError = true;
            break;
          }
          continue;
        }

        if (event.type === 'session.idle' && event.properties.sessionID === sessionID) {
          break;
        }

        if (
          event.type === 'session.status' &&
          event.properties.sessionID === sessionID &&
          event.properties.status.type === 'idle'
        ) {
          break;
        }
      }
    })().catch(() => {
      // Stream can error when aborted/server closes; handled by outer control flow.
    });

    await client.session.promptAsync({
      path: { id: sessionID },
      query: { directory: options.cwd },
      body: promptBody,
      signal: controller.signal,
    });

    await streamPromise;

    if (sessionError) {
      output.flush();
      return { output: output.getOutput(), exitCode: 1 };
    }

    if (!hasVisibleOutput) {
      const messagesResponse = await client.session.messages({
        path: { id: sessionID },
        query: { directory: options.cwd },
        signal: controller.signal,
      });

      const latestAssistantMessage = [...(messagesResponse.data || [])]
        .reverse()
        .find((message) => message.info.role === 'assistant');

      for (const part of latestAssistantMessage?.parts || []) {
        if (
          (part.type === 'text' || part.type === 'reasoning') &&
          part.text &&
          !renderedTextPartIds.has(part.id)
        ) {
          renderedTextPartIds.add(part.id);
          output.append(part.text);
          hasVisibleOutput = true;
        }

        if (part.type === 'tool') {
          const state = part.state;
          if (state?.status === 'completed') {
            output.append(`\n[tool:${part.tool}] ${state.title || part.tool}\n`);
            hasVisibleOutput = true;
          }

          if (state?.status === 'error') {
            output.append(`\n[tool:${part.tool} error] ${state.error}\n`);
            hasVisibleOutput = true;
          }
        }
      }

      if (!hasVisibleOutput) {
        output.append('OpenCode SDK completed without textual output.\n');
      }
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
