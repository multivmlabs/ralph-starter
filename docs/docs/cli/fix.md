---
sidebar_position: 2
title: fix
description: Fix build errors, lint issues, or design problems
keywords: [cli, fix, command, build errors, lint, design]
---

# ralph-starter fix

Fix build errors, lint issues, or design problems.

## Synopsis

```bash
ralph-starter fix [task] [options]
```

## Description

The `fix` command runs a focused AI loop to fix project issues. It scans for build, lint, typecheck, and test failures, then orchestrates a coding agent to fix them automatically.

When given a custom task describing a visual or design problem (e.g., "fix the paddings and make the colors brighter"), the fix command detects CSS/design keywords and:

- Auto-applies installed design skills (frontend-design, ui-ux-designer, etc.)
- Instructs the agent to visually verify changes using the `/web-design-reviewer` skill with browser screenshots

## Arguments

| Argument | Description |
|----------|-------------|
| `task` | Optional description of what to fix. If not provided, scans for build/lint errors. |

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--scan` | Force full project scan (build + lint + typecheck + tests) | false |
| `--agent <name>` | Specify agent (claude-code, cursor, codex, opencode) | auto-detect |
| `--commit` | Auto-commit the fix | false |
| `--max-iterations <n>` | Maximum fix iterations | 3 |
| `--output-dir <path>` | Project directory | cwd |

## Examples

### Fix Build Errors

```bash
# Auto-detect and fix build/lint errors
ralph-starter fix

# Force full project scan
ralph-starter fix --scan
```

### Fix Design Issues

```bash
# Fix visual/CSS problems
ralph-starter fix "fix the paddings and make the colors brighter"

# Fix responsive layout
ralph-starter fix "make the layout responsive on mobile"

# Fix color theme
ralph-starter fix "change the color scheme to darker tones"
```

### With Options

```bash
# Auto-commit the fix
ralph-starter fix --scan --commit

# Use a specific agent
ralph-starter fix "fix lint errors" --agent claude-code

# Allow more iterations for complex fixes
ralph-starter fix "fix all test failures" --max-iterations 5
```

## Behavior

1. **Error Detection**:
   - If `task` provided → runs build check for baseline, then fixes the described issue
   - If no task and previous failures exist → re-runs failed validations from `.ralph/activity.md`
   - If `--scan` → runs full validation suite (build + lint + typecheck + tests)

2. **Skill Detection**:
   - Detects installed Claude Code skills relevant to the task
   - For CSS/design tasks → auto-applies design skills and adds visual verification instructions
   - Searches skills.sh for complementary skills if needed

3. **Fix Loop**:
   - Agent works on fixing issues (default: 3 iterations)
   - Lint checks run between iterations (fast feedback)
   - Full build check runs on final iteration
   - If build fails on final iteration → extends loop by 2 extra iterations

4. **Verification**:
   - Re-runs original validation commands after the loop
   - Reports success only if all checks pass (not just agent completion)

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | All issues fixed |
| 1 | Could not fix all issues automatically |

## See Also

- [ralph-starter run](/docs/cli/run)
- [ralph-starter skill](/docs/cli/skill)
- [Validation](/docs/advanced/validation)
- [Skills System](/docs/guides/skills-system)
