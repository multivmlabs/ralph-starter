---
sidebar_position: 2
title: figma
description: Interactive Figma design-to-code wizard
keywords: [cli, figma, design, wizard, command]
---

# ralph-starter figma

Interactive wizard to convert Figma designs to code in one command.

## Synopsis

```bash
ralph-starter figma [options]
```

## Description

The `figma` command launches a 4-step interactive wizard that guides you through converting a Figma design into production code. It auto-detects your project's tech stack and available AI agents, then delegates to the build loop.

## Wizard Flow

### Step 1: Figma Design URL

Paste the full Figma file or frame URL. Supports all URL formats:

- `https://figma.com/design/ABC123/MyDesign`
- `https://figma.com/file/ABC123/MyDesign?node-id=1:23`
- Raw file key: `ABC123...`

### Step 2: Task Description

Describe what you want to build from the design:

- "build a responsive landing page"
- "implement the dashboard UI"
- "create the signup flow components"

### Step 3: Tech Stack

Choose or type your tech stack:

- **Auto-detected** from your project's `package.json` (shown as "(Detected)")
- Common options: React + TypeScript + Tailwind, Next.js, Vue, SvelteKit, HTML + CSS
- **Custom**: type any stack (e.g., "astro.js + vue", "svelte + tailwind + drizzle")

### Step 4: Model Selection

Smart dropdown based on detected agents:

- **Claude Code detected**: Claude Opus 4.6 (Recommended), Claude Sonnet 4.5
- **Codex detected**: o3, o4-mini
- Always includes "Custom model ID" for any other model

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--figma-mode <mode>` | Figma mode: `spec`, `tokens`, `components`, `assets`, `content` | `spec` |
| `--figma-framework <framework>` | Component framework: `react`, `vue`, `svelte`, `astro`, `nextjs`, `nuxt`, `html` | Auto-detected |
| `--commit` | Auto-commit changes | `false` |
| `--validate` / `--no-validate` | Run validation after each iteration | `true` |
| `--max-iterations <n>` | Maximum loop iterations | Auto-calculated |
| `--agent <name>` | Specify agent to use | Auto-detected |

## Examples

### Basic Usage

```bash
# Launch the interactive wizard
ralph-starter figma
```

### Power User (Skip Wizard Steps with Flags)

```bash
# Use with a specific framework
ralph-starter figma --figma-framework react

# Auto-commit changes
ralph-starter figma --commit

# Limit iterations
ralph-starter figma --max-iterations 5
```

## How It Works

The `figma` command is a thin wrapper that:

1. Collects your inputs through the interactive wizard
2. Prepends your tech stack to the task description
3. Delegates to `ralph-starter run` with `--from figma` pre-configured
4. The run command fetches the Figma spec, downloads images/icons, and starts the AI coding loop

All the Figma integration features (design tokens, font checking, image downloads, agent guidelines) are automatically applied.

## See Also

- [Figma Source](../sources/figma.md) - Full Figma integration documentation
- [run](./run.md) - The underlying run command
