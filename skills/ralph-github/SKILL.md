---
description: Fetch GitHub issues or PRs and build them with ralph-starter
disable-model-invocation: true
---

Fetch specs from GitHub issues or PRs and run an autonomous coding loop to implement them.

1. Use `ralph_fetch_spec` with `source: "github"` to preview the issue/PR:
   - `identifier`: repo URL, `"owner/repo#123"`, or issue URL
   - Use `project` to filter by repo, `label` to filter by label

2. Use `ralph_run` to build from the spec:
   - Set `from: "github"` and provide `project` (owner/repo)
   - Optionally filter with `label` (e.g., "good first issue", "bug")
   - Set `auto: true`, `commit: true`, `validate: true` for full automation

3. For batch processing multiple issues, use `ralph_run` with `auto: true` — each issue gets its own branch and PR.
