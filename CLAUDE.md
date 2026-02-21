# CLAUDE.md

Context for Claude Code when working on ralph-starter.

## Package Manager

This repo uses **pnpm** for development. The `packageManager` field and a preinstall script enforce this.

Note: ralph-starter itself supports any package manager in user projects via `detectPackageManager()` in `src/utils/package-manager.ts`. Do not hardcode pnpm in agent prompts or user-facing code.

## What is ralph-starter?

A CLI tool that runs autonomous AI coding loops. It fetches specs from GitHub, Linear, Notion, Figma, and Todoist, then orchestrates coding agents to build software automatically. Each loop iteration spawns a fresh agent process with a progressively trimmed context — continuity is maintained through the filesystem (`IMPLEMENTATION_PLAN.md`, `.ralph/iteration-log.md`), not conversation history.

## Quick Commands

```bash
pnpm build        # Build TypeScript
pnpm lint         # Lint code (Biome)
pnpm lint:fix     # Lint and auto-fix
pnpm test         # Run tests (Vitest, watch mode)
pnpm test:run     # Run tests once
pnpm dev          # Development mode (tsc --watch)
pnpm format       # Format code (Biome)
pnpm check        # Check code (Biome lint + format)
pnpm typecheck    # Type-check without emitting
```

## Repository Structure

- `src/` - TypeScript source code (see directory overview below)
- `docs/` - Docusaurus documentation site
- `dist/` - Compiled output
- `content/` - Content files
- `specs/` - Spec files for development

## Key Concepts

**Integrations** - Fetch specs from external sources:
- GitHub: Issues, PRs, files
- Linear: Tickets by team/project
- Notion: Pages and databases
- Figma: Design specs and tokens
- Todoist: Tasks and projects

**Agents** - AI coding assistants ralph-starter orchestrates:
- Claude Code, Cursor, Codex CLI, OpenCode

**Loop Executor** - Runs agents in autonomous loops until task completion. Each iteration: build context → spawn agent → collect output → run validation (lint/build) → commit → repeat or exit.

**LLM Providers** - For internal features (Anthropic, OpenAI, OpenRouter)

**MCP Server** - Model Context Protocol server exposing ralph-starter capabilities as tools (init, plan, run)

## Important Files

| File | Purpose |
|------|---------|
| `src/cli.ts` | CLI entry point |
| `src/loop/executor.ts` | Main loop logic (1400+ lines) |
| `src/loop/agents.ts` | Agent detection and invocation |
| `src/loop/context-builder.ts` | Iteration prompt building and progressive trimming |
| `src/loop/cost-tracker.ts` | Token/cost tracking per iteration |
| `src/loop/validation.ts` | Lint/build validation between iterations |
| `src/loop/session.ts` | Pause/resume support |
| `src/loop/step-detector.ts` | Real-time progress detection from agent output |
| `src/commands/run.ts` | Run command implementation |
| `src/commands/auto.ts` | Batch/auto mode command |
| `src/integrations/base.ts` | Integration interface |
| `src/llm/providers.ts` | LLM provider definitions |
| `src/mcp/server.ts` | MCP server entry point |
| `src/utils/package-manager.ts` | Package manager detection (npm/yarn/pnpm/bun) |
| `src/sources/` | Spec source fetching (file, URL, PDF, GitHub, integrations) |

## src/ Directory Overview

| Directory | Purpose |
|-----------|---------|
| `auth/` | OAuth providers (Anthropic, OpenAI, Linear, Notion, Todoist) |
| `automation/` | Git operations (commit, push, PR creation) |
| `commands/` | CLI commands (run, init, plan, auto, fix, pause, resume, etc.) |
| `config/` | Configuration management |
| `integrations/` | GitHub, Linear, Notion, Figma source fetching |
| `llm/` | LLM provider APIs and batch operations |
| `loop/` | Core autonomous loop (executor, agents, validation, context) |
| `mcp/` | Model Context Protocol server |
| `presets/` | Configuration presets |
| `setup/` | Setup wizards and agent detection |
| `skills/` | Auto-install skills for agents |
| `sources/` | Spec source fetching (file, URL, PDF, integrations) |
| `types/` | TypeScript type definitions |
| `ui/` | UI components (box, progress-renderer, shimmer) |
| `utils/` | Utilities (rate limiting, version, package manager) |
| `wizard/` | Interactive setup wizard and idea generation |

## When Making Changes

1. Run `pnpm build` after changes
2. Run `pnpm test:run` to verify tests pass
3. Update README.md for user-facing features
4. Follow existing code patterns
5. Use ESM imports with `.js` extensions
6. Use Biome for linting/formatting (not ESLint/Prettier)

## Current Priorities

- Amp SDK migration (agent abstraction layer)
- Linear integration sync (status updates, GitHub Actions)
- Agent memory improvements (`.ralph/memory.md`)
- Multi-agent / swarm mode
- Lovable/v0/Bolt.new integrations

## Links

- Docs: https://ralphstarter.ai
- Ideas: https://github.com/multivmlabs/ralph-ideas
- Templates: https://github.com/multivmlabs/ralph-templates
