/**
 * OpenRouter Live Model API
 *
 * Fetches the live model list from OpenRouter's API with pricing,
 * context windows, and capabilities. Cached for 1 hour.
 */

export type OpenRouterModel = {
  id: string;
  name: string;
  description?: string;
  contextLength: number;
  pricing: {
    prompt: number; // USD per token
    completion: number; // USD per token
  };
  topProvider?: {
    maxCompletionTokens?: number;
  };
};

export type OpenRouterModelInfo = {
  id: string;
  name: string;
  contextLength: number;
  promptPricePerMillion: number;
  completionPricePerMillion: number;
  maxCompletionTokens?: number;
};

type CacheEntry = {
  models: OpenRouterModelInfo[];
  fetchedAt: number;
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let cache: CacheEntry | null = null;

/**
 * Fetch live model list from OpenRouter API.
 * Results are cached for 1 hour.
 *
 * Does NOT require an API key — the models endpoint is public.
 */
export async function fetchOpenRouterModels(): Promise<OpenRouterModelInfo[]> {
  // Return cached if still valid
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.models;
  }

  const response = await fetch('https://openrouter.ai/api/v1/models');
  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as { data: OpenRouterModel[] };

  const models: OpenRouterModelInfo[] = json.data
    .filter((m) => m.pricing && m.pricing.prompt !== undefined)
    .map((m) => ({
      id: m.id,
      name: m.name,
      contextLength: m.contextLength || 0,
      promptPricePerMillion: (m.pricing.prompt || 0) * 1_000_000,
      completionPricePerMillion: (m.pricing.completion || 0) * 1_000_000,
      maxCompletionTokens: m.topProvider?.maxCompletionTokens,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  cache = { models, fetchedAt: Date.now() };
  return models;
}

/**
 * Clear the model cache (useful for testing).
 */
export function clearModelCache(): void {
  cache = null;
}

/**
 * Search models by name or ID.
 */
export function filterModels(models: OpenRouterModelInfo[], query: string): OpenRouterModelInfo[] {
  const lower = query.toLowerCase();
  return models.filter(
    (m) => m.id.toLowerCase().includes(lower) || m.name.toLowerCase().includes(lower)
  );
}

/**
 * Format a model for display in a selector.
 */
export function formatModelChoice(model: OpenRouterModelInfo): string {
  const ctx = model.contextLength > 0 ? `${Math.round(model.contextLength / 1024)}K ctx` : '';
  const price =
    model.promptPricePerMillion === 0
      ? 'free'
      : `$${model.promptPricePerMillion.toFixed(2)}/$${model.completionPricePerMillion.toFixed(2)} per 1M`;
  return `${model.name} (${model.id}) — ${ctx}${ctx && price ? ', ' : ''}${price}`;
}

/**
 * Get pricing for a specific model from the live API.
 * Falls back to null if the model is not found.
 */
export async function getModelPricing(
  modelId: string
): Promise<{ inputPricePerMillion: number; outputPricePerMillion: number } | null> {
  try {
    const models = await fetchOpenRouterModels();
    const model = models.find((m) => m.id === modelId);
    if (!model) return null;

    return {
      inputPricePerMillion: model.promptPricePerMillion,
      outputPricePerMillion: model.completionPricePerMillion,
    };
  } catch {
    return null;
  }
}
