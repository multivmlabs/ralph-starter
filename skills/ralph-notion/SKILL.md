---
description: Fetch Notion pages and build from them with ralph-starter
disable-model-invocation: true
---

Fetch specs from Notion pages or databases and run an autonomous coding loop.

1. Use `ralph_fetch_spec` with `source: "notion"` to preview the page:
   - `identifier`: Notion page URL

2. Use `ralph_run` to build from the Notion spec:
   - Set `from: "notion"`
   - Set `auto: true`, `commit: true`, `validate: true` for full automation

Works with Notion pages and databases. The content is extracted as markdown and used as the spec for the coding loop.
