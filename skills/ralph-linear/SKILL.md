---
description: Fetch Linear tickets and build them with ralph-starter
disable-model-invocation: true
---

Fetch specs from Linear tickets and run an autonomous coding loop to implement them.

1. Use `ralph_fetch_spec` with `source: "linear"` to preview the ticket:
   - `identifier`: project or team name
   - Use `project` and `label` to filter tickets

2. Use `ralph_run` to build from the ticket:
   - Set `from: "linear"` and provide `project` (team/project name)
   - Optionally filter with `label`
   - Set `auto: true`, `commit: true`, `validate: true` for full automation

3. Use `ralph_task` to manage Linear tickets directly:
   - `action: "list"` with `source: "linear"` to see tickets
   - `action: "create"` to create new tickets
   - `action: "update"` / `action: "close"` with the ticket ID (e.g., "RAL-42")
