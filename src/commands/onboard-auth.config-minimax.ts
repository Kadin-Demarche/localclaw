import type { LocalClawConfig } from "../config/config.js";
import type { ModelDefinitionConfig } from "../config/types.models.js";
import {
  buildMinimaxApiModelDefinition,
  buildMinimaxModelDefinition,
  DEFAULT_MINIMAX_BASE_URL,
  DEFAULT_MINIMAX_CONTEXT_WINDOW,
  DEFAULT_MINIMAX_MAX_TOKENS,
  MINIMAX_API_BASE_URL,
  MINIMAX_HOSTED_COST,
  MINIMAX_HOSTED_MODEL_ID,
  MINIMAX_HOSTED_MODEL_REF,
  MINIMAX_LM_STUDIO_COST,
} from "./onboard-auth.models.js";

const LMSTUDIO_BASE_URL = "http://127.0.0.1:1234/v1";
const LMSTUDIO_DISCOVERY_TIMEOUT_MS = 3000;
const LMSTUDIO_DEFAULT_MODEL_ID = "minimax-m2.1-gs32";
const LMSTUDIO_DEFAULT_CONTEXT_WINDOW = 196608;
const LMSTUDIO_DEFAULT_MAX_TOKENS = 8192;

function normalizeLmStudioBaseUrl(baseUrl?: string): string {
  const trimmed = baseUrl?.trim();
  if (!trimmed) {
    return LMSTUDIO_BASE_URL;
  }
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function normalizePositiveInteger(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return undefined;
}

function toDiscoveredLmStudioModel(entry: unknown): ModelDefinitionConfig | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }
  const candidate = entry as Record<string, unknown>;
  const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
  if (!id) {
    return null;
  }
  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  const contextWindow =
    normalizePositiveInteger(candidate.context_window) ??
    normalizePositiveInteger(candidate.contextWindow) ??
    normalizePositiveInteger(candidate.max_context_length) ??
    normalizePositiveInteger(candidate.maxContextLength) ??
    LMSTUDIO_DEFAULT_CONTEXT_WINDOW;
  const maxTokens =
    normalizePositiveInteger(candidate.max_tokens) ??
    normalizePositiveInteger(candidate.maxTokens) ??
    LMSTUDIO_DEFAULT_MAX_TOKENS;
  return buildMinimaxModelDefinition({
    id,
    ...(name ? { name } : {}),
    reasoning: false,
    cost: MINIMAX_LM_STUDIO_COST,
    contextWindow,
    maxTokens,
  });
}

function mergeUniqueModels(
  existingModels: ModelDefinitionConfig[],
  additionalModels: ModelDefinitionConfig[],
): ModelDefinitionConfig[] {
  const merged: ModelDefinitionConfig[] = [...existingModels];
  const existingIds = new Set(existingModels.map((model) => model.id));
  for (const model of additionalModels) {
    if (existingIds.has(model.id)) {
      continue;
    }
    merged.push(model);
    existingIds.add(model.id);
  }
  return merged;
}

async function discoverLmStudioInstalledModels(baseUrl: string): Promise<ModelDefinitionConfig[]> {
  try {
    const response = await fetch(`${baseUrl}/models`, {
      signal: AbortSignal.timeout(LMSTUDIO_DISCOVERY_TIMEOUT_MS),
    });
    if (!response.ok) {
      return [];
    }
    const payload = (await response.json()) as { data?: unknown };
    if (!Array.isArray(payload?.data)) {
      return [];
    }
    const discovered: ModelDefinitionConfig[] = [];
    const seen = new Set<string>();
    for (const entry of payload.data) {
      const model = toDiscoveredLmStudioModel(entry);
      if (!model || seen.has(model.id)) {
        continue;
      }
      discovered.push(model);
      seen.add(model.id);
    }
    return discovered;
  } catch {
    return [];
  }
}

export async function applyLmStudioInstalledModelsConfig(
  cfg: LocalClawConfig,
): Promise<LocalClawConfig> {
  const providers = { ...cfg.models?.providers };
  const existingProvider = providers.lmstudio;
  const baseUrl = normalizeLmStudioBaseUrl(existingProvider?.baseUrl);
  const discoveredModels = await discoverLmStudioInstalledModels(baseUrl);
  if (discoveredModels.length === 0) {
    return cfg;
  }

  const existingModels = Array.isArray(existingProvider?.models) ? existingProvider.models : [];
  const mergedModels = mergeUniqueModels(existingModels, discoveredModels);
  providers.lmstudio = {
    ...existingProvider,
    baseUrl,
    apiKey: existingProvider?.apiKey ?? "lmstudio",
    api: existingProvider?.api ?? "openai-responses",
    models: mergedModels,
  };

  return {
    ...cfg,
    models: {
      mode: cfg.models?.mode ?? "merge",
      providers,
    },
  };
}

export function applyMinimaxProviderConfig(cfg: LocalClawConfig): LocalClawConfig {
  const models = { ...cfg.agents?.defaults?.models };
  models["anthropic/claude-opus-4-6"] = {
    ...models["anthropic/claude-opus-4-6"],
    alias: models["anthropic/claude-opus-4-6"]?.alias ?? "Opus",
  };
  models["lmstudio/minimax-m2.1-gs32"] = {
    ...models["lmstudio/minimax-m2.1-gs32"],
    alias: models["lmstudio/minimax-m2.1-gs32"]?.alias ?? "Minimax",
  };

  const providers = { ...cfg.models?.providers };
  const existingProvider = providers.lmstudio;
  const existingModels = Array.isArray(existingProvider?.models) ? existingProvider.models : [];
  const minimaxModel = buildMinimaxModelDefinition({
    id: LMSTUDIO_DEFAULT_MODEL_ID,
    name: "MiniMax M2.1 GS32",
    reasoning: false,
    cost: MINIMAX_LM_STUDIO_COST,
    contextWindow: LMSTUDIO_DEFAULT_CONTEXT_WINDOW,
    maxTokens: LMSTUDIO_DEFAULT_MAX_TOKENS,
  });
  const mergedModels = mergeUniqueModels(existingModels, [minimaxModel]);
  providers.lmstudio = {
    ...existingProvider,
    baseUrl: normalizeLmStudioBaseUrl(existingProvider?.baseUrl),
    apiKey: existingProvider?.apiKey ?? "lmstudio",
    api: existingProvider?.api ?? "openai-responses",
    models: mergedModels,
  };

  return {
    ...cfg,
    agents: {
      ...cfg.agents,
      defaults: {
        ...cfg.agents?.defaults,
        models,
      },
    },
    models: {
      mode: cfg.models?.mode ?? "merge",
      providers,
    },
  };
}

export function applyMinimaxHostedProviderConfig(
  cfg: LocalClawConfig,
  params?: { baseUrl?: string },
): LocalClawConfig {
  const models = { ...cfg.agents?.defaults?.models };
  models[MINIMAX_HOSTED_MODEL_REF] = {
    ...models[MINIMAX_HOSTED_MODEL_REF],
    alias: models[MINIMAX_HOSTED_MODEL_REF]?.alias ?? "Minimax",
  };

  const providers = { ...cfg.models?.providers };
  const hostedModel = buildMinimaxModelDefinition({
    id: MINIMAX_HOSTED_MODEL_ID,
    cost: MINIMAX_HOSTED_COST,
    contextWindow: DEFAULT_MINIMAX_CONTEXT_WINDOW,
    maxTokens: DEFAULT_MINIMAX_MAX_TOKENS,
  });
  const existingProvider = providers.minimax;
  const existingModels = Array.isArray(existingProvider?.models) ? existingProvider.models : [];
  const hasHostedModel = existingModels.some((model) => model.id === MINIMAX_HOSTED_MODEL_ID);
  const mergedModels = hasHostedModel ? existingModels : [...existingModels, hostedModel];
  providers.minimax = {
    ...existingProvider,
    baseUrl: params?.baseUrl?.trim() || DEFAULT_MINIMAX_BASE_URL,
    apiKey: "minimax",
    api: "openai-completions",
    models: mergedModels.length > 0 ? mergedModels : [hostedModel],
  };

  return {
    ...cfg,
    agents: {
      ...cfg.agents,
      defaults: {
        ...cfg.agents?.defaults,
        models,
      },
    },
    models: {
      mode: cfg.models?.mode ?? "merge",
      providers,
    },
  };
}

export function applyMinimaxConfig(cfg: LocalClawConfig): LocalClawConfig {
  const next = applyMinimaxProviderConfig(cfg);
  return {
    ...next,
    agents: {
      ...next.agents,
      defaults: {
        ...next.agents?.defaults,
        model: {
          ...(next.agents?.defaults?.model &&
          "fallbacks" in (next.agents.defaults.model as Record<string, unknown>)
            ? {
                fallbacks: (next.agents.defaults.model as { fallbacks?: string[] }).fallbacks,
              }
            : undefined),
          primary: "lmstudio/minimax-m2.1-gs32",
        },
      },
    },
  };
}

export function applyMinimaxHostedConfig(
  cfg: LocalClawConfig,
  params?: { baseUrl?: string },
): LocalClawConfig {
  const next = applyMinimaxHostedProviderConfig(cfg, params);
  return {
    ...next,
    agents: {
      ...next.agents,
      defaults: {
        ...next.agents?.defaults,
        model: {
          ...next.agents?.defaults?.model,
          primary: MINIMAX_HOSTED_MODEL_REF,
        },
      },
    },
  };
}

// MiniMax Anthropic-compatible API (platform.minimax.io/anthropic)
export function applyMinimaxApiProviderConfig(
  cfg: LocalClawConfig,
  modelId: string = "MiniMax-M2.1",
): LocalClawConfig {
  const providers = { ...cfg.models?.providers };
  const existingProvider = providers.minimax;
  const existingModels = Array.isArray(existingProvider?.models) ? existingProvider.models : [];
  const apiModel = buildMinimaxApiModelDefinition(modelId);
  const hasApiModel = existingModels.some((model) => model.id === modelId);
  const mergedModels = hasApiModel ? existingModels : [...existingModels, apiModel];
  const { apiKey: existingApiKey, ...existingProviderRest } = (existingProvider ?? {}) as Record<
    string,
    unknown
  > as { apiKey?: string };
  const resolvedApiKey = typeof existingApiKey === "string" ? existingApiKey : undefined;
  const normalizedApiKey = resolvedApiKey?.trim() === "minimax" ? "" : resolvedApiKey;
  providers.minimax = {
    ...existingProviderRest,
    baseUrl: MINIMAX_API_BASE_URL,
    api: "anthropic-messages",
    ...(normalizedApiKey?.trim() ? { apiKey: normalizedApiKey } : {}),
    models: mergedModels.length > 0 ? mergedModels : [apiModel],
  };

  const models = { ...cfg.agents?.defaults?.models };
  models[`minimax/${modelId}`] = {
    ...models[`minimax/${modelId}`],
    alias: "Minimax",
  };

  return {
    ...cfg,
    agents: {
      ...cfg.agents,
      defaults: {
        ...cfg.agents?.defaults,
        models,
      },
    },
    models: { mode: cfg.models?.mode ?? "merge", providers },
  };
}

export function applyMinimaxApiConfig(
  cfg: LocalClawConfig,
  modelId: string = "MiniMax-M2.1",
): LocalClawConfig {
  const next = applyMinimaxApiProviderConfig(cfg, modelId);
  return {
    ...next,
    agents: {
      ...next.agents,
      defaults: {
        ...next.agents?.defaults,
        model: {
          ...(next.agents?.defaults?.model &&
          "fallbacks" in (next.agents.defaults.model as Record<string, unknown>)
            ? {
                fallbacks: (next.agents.defaults.model as { fallbacks?: string[] }).fallbacks,
              }
            : undefined),
          primary: `minimax/${modelId}`,
        },
      },
    },
  };
}
