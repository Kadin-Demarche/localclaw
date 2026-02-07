import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveGatewayStateDir } from "./paths.js";

describe("resolveGatewayStateDir", () => {
  it("uses the default state dir when no overrides are set", () => {
    const env = { HOME: "/Users/test" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".localclaw"));
  });

  it("appends the profile suffix when set", () => {
    const env = { HOME: "/Users/test", LOCALCLAW_PROFILE: "rescue" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".localclaw-rescue"));
  });

  it("treats default profiles as the base state dir", () => {
    const env = { HOME: "/Users/test", LOCALCLAW_PROFILE: "Default" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".localclaw"));
  });

  it("uses LOCALCLAW_STATE_DIR when provided", () => {
    const env = { HOME: "/Users/test", LOCALCLAW_STATE_DIR: "/var/lib/localclaw" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/var/lib/localclaw"));
  });

  it("expands ~ in LOCALCLAW_STATE_DIR", () => {
    const env = { HOME: "/Users/test", LOCALCLAW_STATE_DIR: "~/localclaw-state" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/Users/test/localclaw-state"));
  });

  it("preserves Windows absolute paths without HOME", () => {
    const env = { LOCALCLAW_STATE_DIR: "C:\\State\\localclaw" };
    expect(resolveGatewayStateDir(env)).toBe("C:\\State\\localclaw");
  });
});
