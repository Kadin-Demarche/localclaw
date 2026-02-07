import { describe, expect, it } from "vitest";
import {
  ensureSetupDefaultRouter,
  SETUP_DEFAULT_ROUTER_MODEL_REF,
} from "./setup-default-router.js";

describe("ensureSetupDefaultRouter", () => {
  it("applies LM Studio router defaults when no primary model is configured", () => {
    const result = ensureSetupDefaultRouter({});
    expect(result.applied).toBe(true);
    const model = result.config.agents?.defaults?.model;
    const primary = typeof model === "string" ? model : model?.primary;
    expect(primary).toBe(SETUP_DEFAULT_ROUTER_MODEL_REF);
    expect(result.config.models?.providers?.lmstudio?.baseUrl).toBe("http://127.0.0.1:1234/v1");
  });

  it("does not override an existing string model", () => {
    const cfg = {
      agents: {
        defaults: {
          model: "openai/gpt-5",
        },
      },
    };
    const result = ensureSetupDefaultRouter(cfg);
    expect(result.applied).toBe(false);
    expect(result.config).toBe(cfg);
  });

  it("does not override an existing model.primary value", () => {
    const cfg = {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-opus-4-6",
          },
        },
      },
    };
    const result = ensureSetupDefaultRouter(cfg);
    expect(result.applied).toBe(false);
    expect(result.config).toBe(cfg);
  });
});
