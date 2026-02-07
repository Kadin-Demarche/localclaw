import { describe, it, expect, vi } from "vitest";
import type { LocalClawConfig } from "../config/config.js";
import {
  parseModelRef,
  resolveModelRefFromString,
  resolveConfiguredModelRef,
  buildModelAliasIndex,
  normalizeProviderId,
  modelKey,
  resolveThinkingDefault,
} from "./model-selection.js";

describe("model-selection", () => {
  describe("normalizeProviderId", () => {
    it("should normalize provider names", () => {
      expect(normalizeProviderId("Anthropic")).toBe("anthropic");
      expect(normalizeProviderId("Z.ai")).toBe("zai");
      expect(normalizeProviderId("z-ai")).toBe("zai");
      expect(normalizeProviderId("OpenCode-Zen")).toBe("opencode");
      expect(normalizeProviderId("qwen")).toBe("qwen-portal");
      expect(normalizeProviderId("kimi-code")).toBe("kimi-coding");
    });
  });

  describe("parseModelRef", () => {
    it("should parse full model refs", () => {
      expect(parseModelRef("anthropic/claude-3-5-sonnet", "openai")).toEqual({
        provider: "anthropic",
        model: "claude-3-5-sonnet",
      });
    });

    it("normalizes anthropic alias refs to canonical model ids", () => {
      expect(parseModelRef("anthropic/opus-4.6", "openai")).toEqual({
        provider: "anthropic",
        model: "claude-opus-4-6",
      });
      expect(parseModelRef("opus-4.6", "anthropic")).toEqual({
        provider: "anthropic",
        model: "claude-opus-4-6",
      });
    });

    it("should use default provider if none specified", () => {
      expect(parseModelRef("claude-3-5-sonnet", "anthropic")).toEqual({
        provider: "anthropic",
        model: "claude-3-5-sonnet",
      });
    });

    it("should return null for empty strings", () => {
      expect(parseModelRef("", "anthropic")).toBeNull();
      expect(parseModelRef("  ", "anthropic")).toBeNull();
    });

    it("should handle invalid slash usage", () => {
      expect(parseModelRef("/", "anthropic")).toBeNull();
      expect(parseModelRef("anthropic/", "anthropic")).toBeNull();
      expect(parseModelRef("/model", "anthropic")).toBeNull();
    });
  });

  describe("buildModelAliasIndex", () => {
    it("should build alias index from config", () => {
      const cfg: Partial<LocalClawConfig> = {
        agents: {
          defaults: {
            models: {
              "anthropic/claude-3-5-sonnet": { alias: "fast" },
              "openai/gpt-4o": { alias: "smart" },
            },
          },
        },
      };

      const index = buildModelAliasIndex({
        cfg: cfg as LocalClawConfig,
        defaultProvider: "anthropic",
      });

      expect(index.byAlias.get("fast")?.ref).toEqual({
        provider: "anthropic",
        model: "claude-3-5-sonnet",
      });
      expect(index.byAlias.get("smart")?.ref).toEqual({ provider: "openai", model: "gpt-4o" });
      expect(index.byKey.get(modelKey("anthropic", "claude-3-5-sonnet"))).toEqual(["fast"]);
    });
  });

  describe("resolveModelRefFromString", () => {
    it("should resolve from string with alias", () => {
      const index = {
        byAlias: new Map([
          ["fast", { alias: "fast", ref: { provider: "anthropic", model: "sonnet" } }],
        ]),
        byKey: new Map(),
      };

      const resolved = resolveModelRefFromString({
        raw: "fast",
        defaultProvider: "openai",
        aliasIndex: index,
      });

      expect(resolved?.ref).toEqual({ provider: "anthropic", model: "sonnet" });
      expect(resolved?.alias).toBe("fast");
    });

    it("should resolve direct ref if no alias match", () => {
      const resolved = resolveModelRefFromString({
        raw: "openai/gpt-4",
        defaultProvider: "anthropic",
      });
      expect(resolved?.ref).toEqual({ provider: "openai", model: "gpt-4" });
    });
  });

  describe("resolveConfiguredModelRef", () => {
    it("should fall back to anthropic and warn if provider is missing for non-alias", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const cfg: Partial<LocalClawConfig> = {
        agents: {
          defaults: {
            model: "claude-3-5-sonnet",
          },
        },
      };

      const result = resolveConfiguredModelRef({
        cfg: cfg as LocalClawConfig,
        defaultProvider: "google",
        defaultModel: "gemini-pro",
      });

      expect(result).toEqual({ provider: "anthropic", model: "claude-3-5-sonnet" });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Falling back to "anthropic/claude-3-5-sonnet"'),
      );
      warnSpy.mockRestore();
    });

    it("should use default provider/model if config is empty", () => {
      const cfg: Partial<LocalClawConfig> = {};
      const result = resolveConfiguredModelRef({
        cfg: cfg as LocalClawConfig,
        defaultProvider: "openai",
        defaultModel: "gpt-4",
      });
      expect(result).toEqual({ provider: "openai", model: "gpt-4" });
    });
  });

  describe("resolveThinkingDefault", () => {
    it("uses configured default when provided", () => {
      const cfg: Partial<LocalClawConfig> = {
        agents: {
          defaults: {
            thinkingDefault: "high",
          },
        },
      };

      const result = resolveThinkingDefault({
        cfg: cfg as LocalClawConfig,
        provider: "openai",
        model: "gpt-5.2",
        catalog: [{ provider: "openai", id: "gpt-5.2", name: "GPT-5.2", reasoning: true }],
      });

      expect(result).toBe("high");
    });

    it("defaults constrained reasoning models to minimal thinking", () => {
      const result = resolveThinkingDefault({
        cfg: {} as LocalClawConfig,
        provider: "lmstudio",
        model: "qwen3-14b",
        catalog: [
          {
            provider: "lmstudio",
            id: "qwen3-14b",
            name: "Qwen3 14B",
            reasoning: true,
            contextWindow: 40960,
          },
        ],
      });

      expect(result).toBe("minimal");
    });

    it("keeps low thinking default for large-window reasoning models", () => {
      const result = resolveThinkingDefault({
        cfg: {} as LocalClawConfig,
        provider: "anthropic",
        model: "claude-opus-4-6",
        catalog: [
          {
            provider: "anthropic",
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            contextWindow: 200000,
          },
        ],
      });

      expect(result).toBe("low");
    });

    it("defaults non-reasoning models to off", () => {
      const result = resolveThinkingDefault({
        cfg: {} as LocalClawConfig,
        provider: "lmstudio",
        model: "qwen3-14b",
        catalog: [
          {
            provider: "lmstudio",
            id: "qwen3-14b",
            name: "Qwen3 14B",
            reasoning: false,
            contextWindow: 40960,
          },
        ],
      });

      expect(result).toBe("off");
    });
  });
});
