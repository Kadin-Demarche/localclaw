import type { LocalClawConfig } from "../config/config.js";
import { applyMinimaxConfig } from "./onboard-auth.config-minimax.js";

export const SETUP_DEFAULT_ROUTER_MODEL_REF = "lmstudio/minimax-m2.1-gs32";

function resolvePrimaryModel(cfg: LocalClawConfig): string | undefined {
  const model = cfg.agents?.defaults?.model as unknown;
  if (typeof model === "string") {
    const trimmed = model.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (
    model &&
    typeof model === "object" &&
    "primary" in model &&
    typeof (model as { primary?: unknown }).primary === "string"
  ) {
    const trimmed = (model as { primary: string }).primary.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

export function ensureSetupDefaultRouter(cfg: LocalClawConfig): {
  config: LocalClawConfig;
  applied: boolean;
} {
  if (resolvePrimaryModel(cfg)) {
    return { config: cfg, applied: false };
  }

  return {
    config: applyMinimaxConfig(cfg),
    applied: true,
  };
}
