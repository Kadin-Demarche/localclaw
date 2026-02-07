import type { LocalClawPluginApi } from "localclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "localclaw/plugin-sdk";
import { createDiagnosticsOtelService } from "./src/service.js";

const plugin = {
  id: "diagnostics-otel",
  name: "Diagnostics OpenTelemetry",
  description: "Export diagnostics events to OpenTelemetry",
  configSchema: emptyPluginConfigSchema(),
  register(api: LocalClawPluginApi) {
    api.registerService(createDiagnosticsOtelService());
  },
};

export default plugin;
