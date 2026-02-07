---
summary: "CLI reference for `localclaw agents` (list/add/delete/set identity)"
read_when:
  - You want multiple isolated agents (workspaces + routing + auth)
title: "agents"
---

# `localclaw agents`

Manage isolated agents (workspaces + auth + routing).

Related:

- Multi-agent routing: [Multi-Agent Routing](/concepts/multi-agent)
- Agent workspace: [Agent workspace](/concepts/agent-workspace)

## Examples

```bash
localclaw agents list
localclaw agents add work --workspace ~/.localclaw/workspace-work
localclaw agents set-identity --workspace ~/.localclaw/workspace --from-identity
localclaw agents set-identity --agent main --avatar avatars/localclaw.png
localclaw agents delete work
```

## Identity files

Each agent workspace can include an `IDENTITY.md` at the workspace root:

- Example path: `~/.localclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` reads from the workspace root (or an explicit `--identity-file`)

Avatar paths resolve relative to the workspace root.

## Set identity

`set-identity` writes fields into `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (workspace-relative path, http(s) URL, or data URI)

Load from `IDENTITY.md`:

```bash
localclaw agents set-identity --workspace ~/.localclaw/workspace --from-identity
```

Override fields explicitly:

```bash
localclaw agents set-identity --agent main --name "LocalClaw" --emoji "🦞" --avatar avatars/localclaw.png
```

Config sample:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "LocalClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/localclaw.png",
        },
      },
    ],
  },
}
```
