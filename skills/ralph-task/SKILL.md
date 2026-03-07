---
description: Manage tasks across GitHub and Linear with ralph-starter
disable-model-invocation: true
---

Manage tasks across GitHub Issues and Linear from a single interface.

Use the `ralph_task` tool:

- **List tasks**: `action: "list"` — shows tasks from GitHub and Linear. Filter with `source`, `project`, `label`, `status`.
- **Create task**: `action: "create"` — requires `title`, `source` (github/linear). Optional: `description`, `labels`, `priority` (P0-P3), `assignee`.
- **Update task**: `action: "update"` — requires `id` (#123 for GitHub, RAL-42 for Linear). Set `status`, `priority`, `assignee`.
- **Close task**: `action: "close"` — requires `id`. Optional `comment` for a closing note.
- **Comment**: `action: "comment"` — requires `id` and `comment`.

The platform is auto-detected from the ID format: `#123` = GitHub, `RAL-42` = Linear.
