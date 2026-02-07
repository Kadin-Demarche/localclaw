import JSON5 from "json5";
import fs from "node:fs/promises";
import type { RuntimeEnv } from "../runtime.js";
import { DEFAULT_AGENT_WORKSPACE_DIR, ensureAgentWorkspace } from "../agents/workspace.js";
import { type LocalClawConfig, createConfigIO, writeConfigFile } from "../config/config.js";
import { formatConfigPath, logConfigUpdated } from "../config/logging.js";
import { resolveSessionTranscriptsDir } from "../config/sessions.js";
import { defaultRuntime } from "../runtime.js";
import { shortenHomePath } from "../utils.js";
import { ensureSetupDefaultRouter } from "./setup-default-router.js";

async function readConfigFileRaw(configPath: string): Promise<{
  exists: boolean;
  parsed: LocalClawConfig;
}> {
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    const parsed = JSON5.parse(raw);
    if (parsed && typeof parsed === "object") {
      return { exists: true, parsed: parsed as LocalClawConfig };
    }
    return { exists: true, parsed: {} };
  } catch {
    return { exists: false, parsed: {} };
  }
}

export async function setupCommand(
  opts?: { workspace?: string },
  runtime: RuntimeEnv = defaultRuntime,
) {
  const desiredWorkspace =
    typeof opts?.workspace === "string" && opts.workspace.trim()
      ? opts.workspace.trim()
      : undefined;

  const io = createConfigIO();
  const configPath = io.configPath;
  const existingRaw = await readConfigFileRaw(configPath);
  const cfg = existingRaw.parsed;
  const defaults = cfg.agents?.defaults ?? {};

  const workspace = desiredWorkspace ?? defaults.workspace ?? DEFAULT_AGENT_WORKSPACE_DIR;

  const next: LocalClawConfig = {
    ...cfg,
    agents: {
      ...cfg.agents,
      defaults: {
        ...defaults,
        workspace,
      },
    },
  };
  const withDefaultRouter = ensureSetupDefaultRouter(next);
  const nextConfig = withDefaultRouter.config;
  const workspaceChanged = defaults.workspace !== workspace;

  if (!existingRaw.exists || workspaceChanged || withDefaultRouter.applied) {
    await writeConfigFile(nextConfig);
    if (!existingRaw.exists) {
      runtime.log(`Wrote ${formatConfigPath(configPath)}`);
    } else {
      const reasons: string[] = [];
      if (workspaceChanged) {
        reasons.push("set agents.defaults.workspace");
      }
      if (withDefaultRouter.applied) {
        reasons.push("set default router to lmstudio/minimax-m2.1-gs32");
      }
      const suffix = reasons.length > 0 ? `(${reasons.join("; ")})` : undefined;
      logConfigUpdated(runtime, { path: configPath, suffix });
    }
  } else {
    runtime.log(`Config OK: ${formatConfigPath(configPath)}`);
  }

  const ws = await ensureAgentWorkspace({
    dir: workspace,
    ensureBootstrapFiles: !nextConfig.agents?.defaults?.skipBootstrap,
  });
  runtime.log(`Workspace OK: ${shortenHomePath(ws.dir)}`);

  const sessionsDir = resolveSessionTranscriptsDir();
  await fs.mkdir(sessionsDir, { recursive: true });
  runtime.log(`Sessions OK: ${shortenHomePath(sessionsDir)}`);
}
