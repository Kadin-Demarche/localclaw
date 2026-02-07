import { describe, expect, it } from "vitest";
import {
  buildParseArgv,
  getFlagValue,
  getCommandPath,
  getPrimaryCommand,
  getPositiveIntFlagValue,
  getVerboseFlag,
  hasHelpOrVersion,
  hasFlag,
  shouldMigrateState,
  shouldMigrateStateFromPath,
} from "./argv.js";

describe("argv helpers", () => {
  it("detects help/version flags", () => {
    expect(hasHelpOrVersion(["node", "localclaw", "--help"])).toBe(true);
    expect(hasHelpOrVersion(["node", "localclaw", "-V"])).toBe(true);
    expect(hasHelpOrVersion(["node", "localclaw", "status"])).toBe(false);
  });

  it("extracts command path ignoring flags and terminator", () => {
    expect(getCommandPath(["node", "localclaw", "status", "--json"], 2)).toEqual(["status"]);
    expect(getCommandPath(["node", "localclaw", "agents", "list"], 2)).toEqual(["agents", "list"]);
    expect(getCommandPath(["node", "localclaw", "status", "--", "ignored"], 2)).toEqual(["status"]);
  });

  it("returns primary command", () => {
    expect(getPrimaryCommand(["node", "localclaw", "agents", "list"])).toBe("agents");
    expect(getPrimaryCommand(["node", "localclaw"])).toBeNull();
  });

  it("parses boolean flags and ignores terminator", () => {
    expect(hasFlag(["node", "localclaw", "status", "--json"], "--json")).toBe(true);
    expect(hasFlag(["node", "localclaw", "--", "--json"], "--json")).toBe(false);
  });

  it("extracts flag values with equals and missing values", () => {
    expect(getFlagValue(["node", "localclaw", "status", "--timeout", "5000"], "--timeout")).toBe(
      "5000",
    );
    expect(getFlagValue(["node", "localclaw", "status", "--timeout=2500"], "--timeout")).toBe(
      "2500",
    );
    expect(getFlagValue(["node", "localclaw", "status", "--timeout"], "--timeout")).toBeNull();
    expect(getFlagValue(["node", "localclaw", "status", "--timeout", "--json"], "--timeout")).toBe(
      null,
    );
    expect(getFlagValue(["node", "localclaw", "--", "--timeout=99"], "--timeout")).toBeUndefined();
  });

  it("parses verbose flags", () => {
    expect(getVerboseFlag(["node", "localclaw", "status", "--verbose"])).toBe(true);
    expect(getVerboseFlag(["node", "localclaw", "status", "--debug"])).toBe(false);
    expect(getVerboseFlag(["node", "localclaw", "status", "--debug"], { includeDebug: true })).toBe(
      true,
    );
  });

  it("parses positive integer flag values", () => {
    expect(getPositiveIntFlagValue(["node", "localclaw", "status"], "--timeout")).toBeUndefined();
    expect(
      getPositiveIntFlagValue(["node", "localclaw", "status", "--timeout"], "--timeout"),
    ).toBeNull();
    expect(
      getPositiveIntFlagValue(["node", "localclaw", "status", "--timeout", "5000"], "--timeout"),
    ).toBe(5000);
    expect(
      getPositiveIntFlagValue(["node", "localclaw", "status", "--timeout", "nope"], "--timeout"),
    ).toBeUndefined();
  });

  it("builds parse argv from raw args", () => {
    const nodeArgv = buildParseArgv({
      programName: "localclaw",
      rawArgs: ["node", "localclaw", "status"],
    });
    expect(nodeArgv).toEqual(["node", "localclaw", "status"]);

    const versionedNodeArgv = buildParseArgv({
      programName: "localclaw",
      rawArgs: ["node-22", "localclaw", "status"],
    });
    expect(versionedNodeArgv).toEqual(["node-22", "localclaw", "status"]);

    const versionedNodeWindowsArgv = buildParseArgv({
      programName: "localclaw",
      rawArgs: ["node-22.2.0.exe", "localclaw", "status"],
    });
    expect(versionedNodeWindowsArgv).toEqual(["node-22.2.0.exe", "localclaw", "status"]);

    const versionedNodePatchlessArgv = buildParseArgv({
      programName: "localclaw",
      rawArgs: ["node-22.2", "localclaw", "status"],
    });
    expect(versionedNodePatchlessArgv).toEqual(["node-22.2", "localclaw", "status"]);

    const versionedNodeWindowsPatchlessArgv = buildParseArgv({
      programName: "localclaw",
      rawArgs: ["node-22.2.exe", "localclaw", "status"],
    });
    expect(versionedNodeWindowsPatchlessArgv).toEqual(["node-22.2.exe", "localclaw", "status"]);

    const versionedNodeWithPathArgv = buildParseArgv({
      programName: "localclaw",
      rawArgs: ["/usr/bin/node-22.2.0", "localclaw", "status"],
    });
    expect(versionedNodeWithPathArgv).toEqual(["/usr/bin/node-22.2.0", "localclaw", "status"]);

    const nodejsArgv = buildParseArgv({
      programName: "localclaw",
      rawArgs: ["nodejs", "localclaw", "status"],
    });
    expect(nodejsArgv).toEqual(["nodejs", "localclaw", "status"]);

    const nonVersionedNodeArgv = buildParseArgv({
      programName: "localclaw",
      rawArgs: ["node-dev", "localclaw", "status"],
    });
    expect(nonVersionedNodeArgv).toEqual(["node", "localclaw", "node-dev", "localclaw", "status"]);

    const directArgv = buildParseArgv({
      programName: "localclaw",
      rawArgs: ["localclaw", "status"],
    });
    expect(directArgv).toEqual(["node", "localclaw", "status"]);

    const bunArgv = buildParseArgv({
      programName: "localclaw",
      rawArgs: ["bun", "src/entry.ts", "status"],
    });
    expect(bunArgv).toEqual(["bun", "src/entry.ts", "status"]);
  });

  it("builds parse argv from fallback args", () => {
    const fallbackArgv = buildParseArgv({
      programName: "localclaw",
      fallbackArgv: ["status"],
    });
    expect(fallbackArgv).toEqual(["node", "localclaw", "status"]);
  });

  it("decides when to migrate state", () => {
    expect(shouldMigrateState(["node", "localclaw", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "localclaw", "health"])).toBe(false);
    expect(shouldMigrateState(["node", "localclaw", "sessions"])).toBe(false);
    expect(shouldMigrateState(["node", "localclaw", "memory", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "localclaw", "agent", "--message", "hi"])).toBe(false);
    expect(shouldMigrateState(["node", "localclaw", "agents", "list"])).toBe(true);
    expect(shouldMigrateState(["node", "localclaw", "message", "send"])).toBe(true);
  });

  it("reuses command path for migrate state decisions", () => {
    expect(shouldMigrateStateFromPath(["status"])).toBe(false);
    expect(shouldMigrateStateFromPath(["agents", "list"])).toBe(true);
  });
});
