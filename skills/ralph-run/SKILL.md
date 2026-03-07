---
description: Run an autonomous AI coding loop with ralph-starter
disable-model-invocation: true
---

Run an autonomous coding loop using ralph-starter.

1. Use the `ralph_status` tool to check the current project state
2. Use `ralph_run` with the current project path to start the loop
   - Set `auto: true` for fully automated mode
   - Set `commit: true` to auto-commit changes
   - Set `validate: true` to run tests/lint/build between iterations
3. The agent will iterate until the task is complete: read specs, write code, validate, commit, repeat

Options:
- Specify `task` for a one-off task, or let it read from `IMPLEMENTATION_PLAN.md`
- Use `from` to fetch specs from integrations: `github`, `linear`, `notion`, `figma`
- Use `project` and `label` to filter issues from GitHub or Linear
