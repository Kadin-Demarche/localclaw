---
summary: "CLI reference for `localclaw reset` (reset local state/config)"
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
title: "reset"
---

# `localclaw reset`

Reset local config/state (keeps the CLI installed).

```bash
localclaw reset
localclaw reset --dry-run
localclaw reset --scope config+creds+sessions --yes --non-interactive
```
