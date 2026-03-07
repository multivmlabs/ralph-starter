---
description: Run project validation (tests, lint, build) with ralph-starter
disable-model-invocation: true
---

Run all detected validation commands for a project.

1. Use `ralph_validate` with the project path
2. Auto-detects validation commands from:
   - `package.json` scripts (test, lint, build)
   - Makefile targets
   - Common patterns for the detected project type
3. Returns pass/fail status with output for each command

Use `ralph_status` first to check the overall project state and implementation plan progress.
