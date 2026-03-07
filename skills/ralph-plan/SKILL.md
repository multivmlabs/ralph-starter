---
description: Create an implementation plan from specs using ralph-starter
disable-model-invocation: true
---

Create a structured implementation plan from specification files.

1. Use `ralph_status` to verify the project has specs in `specs/`
2. Use `ralph_plan` with the project path to generate an `IMPLEMENTATION_PLAN.md`
   - Set `auto: true` to skip interactive prompts
3. The plan breaks down specs into actionable, checkboxed tasks

If no specs exist yet:
- Use `ralph_init` to scaffold the project first
- Add spec files to the `specs/` directory
- Or use `ralph_fetch_spec` to pull specs from GitHub, Linear, Notion, or Figma
