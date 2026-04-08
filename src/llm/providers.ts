/**
 * LLM Provider configurations for ralph-starter
 */

export type LLMProvider = 'anthropic' | 'openai' | 'openrouter';

export interface ProviderConfig {
  name: LLMProvider;
  displayName: string;
  envVar: string;
  apiUrl: string;
  defaultModel: string;
  consoleUrl: string;
}

/**
 * Model alias map for OpenRouter.
 * Users can pass short names (e.g. "sonnet", "gpt-4o") and they resolve
 * to fully-qualified OpenRouter model IDs.
 *
 * Any full OpenRouter model ID (containing '/') is passed through as-is,
 * so ALL OpenRouter models are supported. These aliases are convenience
 * shortcuts for the most popular models.
 *
 * Rankings source: https://openrouter.ai/rankings
 */
export const OPENROUTER_MODEL_ALIASES: Record<string, string> = {
  // Anthropic
  'claude-4.5-sonnet': 'anthropic/claude-4.5-sonnet-20250929',
  'claude-4-sonnet': 'anthropic/claude-4-sonnet-20250522',
  'claude-sonnet': 'anthropic/claude-4.5-sonnet-20250929',
  sonnet: 'anthropic/claude-4.5-sonnet-20250929',
  'claude-opus': 'anthropic/claude-opus-4-20250514',
  opus: 'anthropic/claude-opus-4-20250514',
  'claude-haiku': 'anthropic/claude-haiku-4-5-20251001',
  haiku: 'anthropic/claude-haiku-4-5-20251001',
  // Google
  'gemini-flash': 'google/gemini-2.5-flash',
  'gemini-pro': 'google/gemini-2.5-pro',
  'gemini-flash-lite': 'google/gemini-2.5-flash-lite',
  'gemini-2.0-flash': 'google/gemini-2.0-flash-001',
  // OpenAI
  'gpt-4o': 'openai/gpt-4o',
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'gpt-4-turbo': 'openai/gpt-4-turbo',
  o1: 'openai/o1',
  'o1-mini': 'openai/o1-mini',
  o3: 'openai/o3',
  'o3-mini': 'openai/o3-mini',
  o4: 'openai/o4',
  'o4-mini': 'openai/o4-mini',
  // xAI
  grok: 'x-ai/grok-4-fast',
  'grok-4': 'x-ai/grok-4-fast',
  'grok-code': 'x-ai/grok-code-fast-1',
  // DeepSeek
  deepseek: 'deepseek/deepseek-chat-v3-0324',
  'deepseek-v3': 'deepseek/deepseek-chat-v3-0324',
  'deepseek-v3.1': 'deepseek/deepseek-chat-v3.1',
  'deepseek-r1': 'deepseek/deepseek-r1',
  // Qwen
  'qwen-coder': 'qwen/qwen3-coder-480b-a35b-07-25',
  qwen: 'qwen/qwen3-coder-480b-a35b-07-25',
  // MiniMax
  minimax: 'minimax/minimax-m2',
  // Meta
  llama: 'meta-llama/llama-3.3-70b-instruct',
  'llama-3.3': 'meta-llama/llama-3.3-70b-instruct',
  'llama-4': 'meta-llama/llama-4-maverick',
  // Mistral
  mistral: 'mistralai/mistral-large',
};

/**
 * Resolve a model name to a fully-qualified OpenRouter model ID.
 * If the name is already a full ID (contains '/'), it's returned as-is.
 */
export function resolveOpenRouterModel(model: string): string {
  if (model.includes('/')) return model;
  return OPENROUTER_MODEL_ALIASES[model.toLowerCase()] || model;
}

export const PROVIDERS: Record<LLMProvider, ProviderConfig> = {
  anthropic: {
    name: 'anthropic',
    displayName: 'Anthropic (Claude)',
    envVar: 'ANTHROPIC_API_KEY',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-4-sonnet-20250522',
    consoleUrl: 'https://console.anthropic.com/',
  },
  openai: {
    name: 'openai',
    displayName: 'OpenAI (GPT-4)',
    envVar: 'OPENAI_API_KEY',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4-turbo',
    consoleUrl: 'https://platform.openai.com/api-keys',
  },
  openrouter: {
    name: 'openrouter',
    displayName: 'OpenRouter (Multiple models)',
    envVar: 'OPENROUTER_API_KEY',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'anthropic/claude-4.5-sonnet-20250929',
    consoleUrl: 'https://openrouter.ai/keys',
  },
};

export const PROVIDER_NAMES = Object.keys(PROVIDERS) as LLMProvider[];

/**
 * Auto-detect available provider from environment variables
 * Returns the first provider with an available API key, or null
 */
export function detectProviderFromEnv(): LLMProvider | null {
  for (const provider of PROVIDER_NAMES) {
    const envVar = PROVIDERS[provider].envVar;
    if (process.env[envVar]) {
      return provider;
    }
  }
  return null;
}

/**
 * Get API key for a provider from environment
 */
export function getProviderKeyFromEnv(provider: LLMProvider): string | null {
  const envVar = PROVIDERS[provider].envVar;
  return process.env[envVar] || null;
}
