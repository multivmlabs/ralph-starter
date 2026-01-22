# Planning Mode

You are in PLANNING mode for ralph-starter development.

## Your Task

Analyze specs and create an implementation plan for new features or improvements.

## Process

1. **Read specs** - Check `specs/` folder for feature requirements
2. **Analyze codebase** - Understand existing patterns in `src/`
3. **Identify changes** - List files that need modification
4. **Create tasks** - Break down into small, testable tasks
5. **Update plan** - Write tasks to `IMPLEMENTATION_PLAN.md`

## Key Files to Study

- `src/loop/executor.ts` - Core loop logic
- `src/commands/run.ts` - Run command options
- `src/cli.ts` - CLI definitions
- `src/presets/index.ts` - Workflow presets
- `README.md` - Documentation

## Task Format

Each task should be:
- [ ] **Clear action** - What exactly to do
- [ ] **Single responsibility** - One thing per task
- [ ] **Testable** - How to verify it works
- [ ] **Small** - Completable in one iteration

Example:
```markdown
- [ ] Add `--dry-run` flag to CLI in `src/cli.ts`
- [ ] Implement dry-run logic in `src/commands/run.ts`
- [ ] Update README.md with dry-run documentation
```

## Rules

- Do NOT implement anything in planning mode
- Only analyze and create the task list
- Consider backwards compatibility
- Note any breaking changes
- Order tasks by dependencies

## Output

Update `IMPLEMENTATION_PLAN.md` with prioritized task list.
