---
summary: "CLI reference for `localclaw plugins` (list, install, enable/disable, doctor)"
read_when:
  - You want to install or manage in-process Gateway plugins
  - You want to debug plugin load failures
title: "plugins"
---

# `localclaw plugins`

Manage Gateway plugins/extensions (loaded in-process).

Related:

- Plugin system: [Plugins](/plugin)
- Plugin manifest + schema: [Plugin manifest](/plugins/manifest)
- Security hardening: [Security](/gateway/security)

## Commands

```bash
localclaw plugins list
localclaw plugins info <id>
localclaw plugins enable <id>
localclaw plugins disable <id>
localclaw plugins doctor
localclaw plugins update <id>
localclaw plugins update --all
```

Bundled plugins ship with LocalClaw but start disabled. Use `plugins enable` to
activate them.

All plugins must ship a `localclaw.plugin.json` file with an inline JSON Schema
(`configSchema`, even if empty). Missing/invalid manifests or schemas prevent
the plugin from loading and fail config validation.

### Install

```bash
localclaw plugins install <path-or-spec>
```

Security note: treat plugin installs like running code. Prefer pinned versions.

Supported archives: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Use `--link` to avoid copying a local directory (adds to `plugins.load.paths`):

```bash
localclaw plugins install -l ./my-plugin
```

### Update

```bash
localclaw plugins update <id>
localclaw plugins update --all
localclaw plugins update <id> --dry-run
```

Updates only apply to plugins installed from npm (tracked in `plugins.installs`).
