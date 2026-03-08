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
 */
export const OPENROUTER_MODEL_ALIASES: Record<string, string> = {
  // Anthropic
  'claude-opus': 'anthropic/claude-opus-4-20250514',
  'claude-sonnet': 'anthropic/claude-sonnet-4-20250514',
  'claude-haiku': 'anthropic/claude-haiku-4-5-20251001',
  opus: 'anthropic/claude-opus-4-20250514',
  sonnet: 'anthropic/claude-sonnet-4-20250514',
  haiku: 'anthropic/claude-haiku-4-5-20251001',
  // OpenAI
  'gpt-4o': 'openai/gpt-4o',
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'gpt-4-turbo': 'openai/gpt-4-turbo',
  o1: 'openai/o1',
  'o1-mini': 'openai/o1-mini',
  o3: 'openai/o3',
  'o3-mini': 'openai/o3-mini',
  o4: 'openai/o4-mini',
  'o4-mini': 'openai/o4-mini',
  // Google
  'gemini-pro': 'google/gemini-2.5-pro-preview',
  'gemini-flash': 'google/gemini-2.5-flash-preview',
  // DeepSeek
  deepseek: 'deepseek/deepseek-chat-v3-0324',
  'deepseek-r1': 'deepseek/deepseek-r1',
  // Meta
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
    defaultModel: 'claude-sonnet-4-20250514',
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
    defaultModel: 'anthropic/claude-sonnet-4-20250514',
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
