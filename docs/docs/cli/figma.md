---
sidebar_position: 12
title: figma
description: Interactive Figma-to-code wizard
keywords: [cli, figma, wizard, design, integration]
---

# ralph-starter figma

Interactive wizard for building code from Figma designs.

## Synopsis

```bash
ralph-starter figma [options]
```

## Description

The `figma` command launches an interactive wizard that guides you through selecting a Figma file, choosing a mode (spec, tokens, components, assets, content), and running an autonomous coding loop to implement the design.

For non-interactive usage and detailed mode documentation, see [Figma Source](/docs/sources/figma).

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--commit` | Auto-commit after tasks | false |
| `--push` | Push commits to remote | false |
| `--pr` | Create pull request when done | false |
| `--validate` | Run validation after iterations | true |
| `--no-validate` | Skip validation | - |
| `--max-iterations <n>` | Maximum loop iterations | 50 |
| `--agent <name>` | Agent to use | auto-detect |

## Examples

```bash
# Launch the interactive wizard
ralph-starter figma

# With auto-commit and PR creation
ralph-starter figma --commit --pr

# Using a specific agent
ralph-starter figma --agent claude-code --max-iterations 10
```

## See Also

- [Figma Source](/docs/sources/figma) - Detailed mode documentation, authentication, and troubleshooting
- [run](/docs/cli/run) - Non-interactive Figma usage via `--from figma`
