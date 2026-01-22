# AGENTS.md

This file defines how Ralph operates when developing ralph-starter itself.

## Project Overview

ralph-starter is a CLI tool for running autonomous AI coding loops using the Ralph Wiggum technique. It's built with TypeScript and runs on Node.js.

## Validation Commands

Run these after each change to ensure quality:

```bash
npm run build      # TypeScript compilation
npm run lint       # ESLint checks (if configured)
npm test           # Run tests (if configured)
```

## Build Instructions

1. Install dependencies: `npm install`
2. Build: `npm run build`
3. Test locally: `npm link` then `ralph-starter --help`

## Code Patterns

### File Structure

```
src/
├── cli.ts              # CLI entry point and command definitions
├── commands/           # Command implementations (run, init, plan, etc.)
├── loop/               # Core loop execution logic
│   ├── executor.ts     # Main loop runner
│   ├── agents.ts       # Agent detection and execution
│   ├── validation.ts   # Backpressure validation
│   ├── circuit-breaker.ts
│   ├── semantic-analyzer.ts
│   ├── progress.ts
│   ├── rate-limiter.ts
│   └── cost-tracker.ts
├── presets/            # Workflow presets
├── sources/            # Input source integrations (GitHub, Todoist, etc.)
├── auth/               # OAuth and authentication
├── automation/         # Git automation
├── wizard/             # Interactive wizard
└── mcp/                # MCP server implementation
```

### Conventions

- Use ESM imports with `.js` extensions (TypeScript compiles to ESM)
- Export interfaces and types from module files
- Use `chalk` for colored output
- Use `ora` for spinners
- Use `inquirer` for interactive prompts
- Use `commander` for CLI argument parsing

### Adding New Features

1. Add types/interfaces first
2. Implement core logic in appropriate module
3. Wire up to CLI in `src/cli.ts`
4. Update `src/commands/run.ts` if it affects the loop
5. Document in README.md

## Task Completion

A task is complete when:
1. `npm run build` passes with no errors
2. Code follows existing patterns
3. README.md is updated (if user-facing)
4. No TODO comments left unaddressed

## Key Files

- [src/loop/executor.ts](src/loop/executor.ts) - Main loop logic
- [src/commands/run.ts](src/commands/run.ts) - Run command implementation
- [src/cli.ts](src/cli.ts) - CLI definitions
- [README.md](README.md) - User documentation
