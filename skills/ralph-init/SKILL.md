---
description: Initialize Ralph Playbook in a project for autonomous coding loops
disable-model-invocation: true
---

Initialize Ralph Playbook scaffolding in a project directory.

1. Use `ralph_init` with the project path to create:
   - `AGENTS.md` — agent configuration
   - `PROMPT_plan.md` and `PROMPT_build.md` — workflow prompts
   - `specs/` directory for specifications
   - `IMPLEMENTATION_PLAN.md` — task tracking

2. Auto-detects project type (Node.js, Python, Rust, Go) and configures validation commands.

After init, add your spec files to `specs/`, then use `/ralph-plan` to generate an implementation plan.
