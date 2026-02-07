import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { withTempHome } from "./test-helpers.js";

describe("config pruning defaults", () => {
  it("does not enable contextPruning by default", async () => {
    const prevApiKey = process.env.ANTHROPIC_API_KEY;
    const prevOauthToken = process.env.ANTHROPIC_OAUTH_TOKEN;
    process.env.ANTHROPIC_API_KEY = "";
    process.env.ANTHROPIC_OAUTH_TOKEN = "";
    await withTempHome(async (home) => {
      const configDir = path.join(home, ".localclaw");
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        path.join(configDir, "localclaw.json"),
        JSON.stringify({ agents: { defaults: {} } }, null, 2),
        "utf-8",
      );

      vi.resetModules();
      const { loadConfig } = await import("./config.js");
      const cfg = loadConfig();

      expect(cfg.agents?.defaults?.contextPruning?.mode).toBeUndefined();
    });
    if (prevApiKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = prevApiKey;
    }
    if (prevOauthToken === undefined) {
      delete process.env.ANTHROPIC_OAUTH_TOKEN;
    } else {
      process.env.ANTHROPIC_OAUTH_TOKEN = prevOauthToken;
    }
  });

  it("enables cache-ttl pruning + 1h heartbeat for Anthropic OAuth", async () => {
    await withTempHome(async (home) => {
      const configDir = path.join(home, ".localclaw");
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        path.join(configDir, "localclaw.json"),
        JSON.stringify(
          {
            auth: {
              profiles: {
                "anthropic:me": { provider: "anthropic", mode: "oauth", email: "me@example.com" },
              },
            },
            agents: { defaults: {} },
          },
          null,
          2,
        ),
        "utf-8",
      );

      vi.resetModules();
      const { loadConfig } = await import("./config.js");
      const cfg = loadConfig();

      expect(cfg.agents?.defaults?.contextPruning?.mode).toBe("cache-ttl");
      expect(cfg.agents?.defaults?.contextPruning?.ttl).toBe("1h");
      expect(cfg.agents?.defaults?.heartbeat?.every).toBe("1h");
    });
  });

  it("enables cache-ttl pruning for local model providers", async () => {
    const prevApiKey = process.env.ANTHROPIC_API_KEY;
    const prevOauthToken = process.env.ANTHROPIC_OAUTH_TOKEN;
    process.env.ANTHROPIC_API_KEY = "";
    process.env.ANTHROPIC_OAUTH_TOKEN = "";

    await withTempHome(async (home) => {
      const configDir = path.join(home, ".localclaw");
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        path.join(configDir, "localclaw.json"),
        JSON.stringify(
          {
            agents: {
              defaults: {
                model: { primary: "lmstudio/qwen3-14b-instruct" },
              },
            },
            models: {
              providers: {
                lmstudio: {
                  baseUrl: "http://127.0.0.1:1234/v1",
                  apiKey: "lmstudio",
                  api: "openai-responses",
                  models: [
                    {
                      id: "qwen3-14b-instruct",
                      name: "Qwen3 14B Instruct",
                      reasoning: false,
                      input: ["text"],
                      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                      contextWindow: 40960,
                      maxTokens: 2048,
                    },
                  ],
                },
              },
            },
          },
          null,
          2,
        ),
        "utf-8",
      );

      vi.resetModules();
      const { loadConfig } = await import("./config.js");
      const cfg = loadConfig();

      expect(cfg.agents?.defaults?.contextPruning?.mode).toBe("cache-ttl");
      expect(cfg.agents?.defaults?.contextPruning?.ttl).toBe("20m");
      expect(cfg.agents?.defaults?.heartbeat?.every).toBeUndefined();
    });

    if (prevApiKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = prevApiKey;
    }
    if (prevOauthToken === undefined) {
      delete process.env.ANTHROPIC_OAUTH_TOKEN;
    } else {
      process.env.ANTHROPIC_OAUTH_TOKEN = prevOauthToken;
    }
  });

  it("enables cache-ttl pruning + 1h cache TTL for Anthropic API keys", async () => {
    await withTempHome(async (home) => {
      const configDir = path.join(home, ".localclaw");
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        path.join(configDir, "localclaw.json"),
        JSON.stringify(
          {
            auth: {
              profiles: {
                "anthropic:api": { provider: "anthropic", mode: "api_key" },
              },
            },
            agents: {
              defaults: {
                model: { primary: "anthropic/claude-opus-4-5" },
              },
            },
          },
          null,
          2,
        ),
        "utf-8",
      );

      vi.resetModules();
      const { loadConfig } = await import("./config.js");
      const cfg = loadConfig();

      expect(cfg.agents?.defaults?.contextPruning?.mode).toBe("cache-ttl");
      expect(cfg.agents?.defaults?.contextPruning?.ttl).toBe("1h");
      expect(cfg.agents?.defaults?.heartbeat?.every).toBe("30m");
      expect(
        cfg.agents?.defaults?.models?.["anthropic/claude-opus-4-5"]?.params?.cacheRetention,
      ).toBe("short");
    });
  });

  it("does not override explicit contextPruning mode", async () => {
    await withTempHome(async (home) => {
      const configDir = path.join(home, ".localclaw");
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        path.join(configDir, "localclaw.json"),
        JSON.stringify({ agents: { defaults: { contextPruning: { mode: "off" } } } }, null, 2),
        "utf-8",
      );

      vi.resetModules();
      const { loadConfig } = await import("./config.js");
      const cfg = loadConfig();

      expect(cfg.agents?.defaults?.contextPruning?.mode).toBe("off");
    });
  });
});
