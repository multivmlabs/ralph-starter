---
sidebar_position: 3
title: github
description: Interactive GitHub issue-to-code wizard with auto-detected tech stack and model selection
keywords: [cli, github, command, wizard, issue-to-code, interactive]
---

# ralph-starter github

Interactive wizard that guides you through implementing a GitHub issue in four steps: pick a repo, select an issue, choose your tech stack, and select a model.

## Synopsis

```bash
ralph-starter github [options]
```

## Interactive Steps

### Step 1: Repository

Enter a GitHub repository in any of these formats:

- `owner/repo` — e.g., `facebook/react`
- Full URL — `https://github.com/owner/repo`

The wizard validates the format before proceeding.

### Step 2: Issue Selection

Fetches open issues from the repository using the `gh` CLI and displays them as a numbered list. Pick the issue you want to implement.

Requirements:
- GitHub CLI (`gh`) must be installed and authenticated
- Repository must be accessible to your account

### Step 3: Tech Stack

Auto-detects your project's framework from `package.json` and shows it as the default. Detection logic:

| Dependency | Detected Stack |
|-----------|---------------|
| `next` | Next.js + TypeScript + Tailwind CSS |
| `astro` | Astro |
| `nuxt` | Nuxt + Vue + TypeScript |
| `svelte` or `@sveltejs/kit` | SvelteKit |
| `vue` | Vue + TypeScript |
| `react` + `tailwindcss` | React + TypeScript + Tailwind CSS |
| `react` (no tailwind) | React + TypeScript |

Additional options: Node.js + TypeScript, Python, or type a custom stack.

### Step 4: Model Selection

Shows available models based on your installed coding agents:

- **Claude Code installed**: Claude Opus 4.6 (recommended), Claude Sonnet 4.5
- **Codex installed**: o3, o4-mini
- **Neither detected**: Falls back to Claude Opus 4.6 and Claude Sonnet 4.5
- **Custom**: Enter any model ID (e.g., `claude-opus-4-6`)

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--commit` | Auto-commit changes after each iteration | `false` |
| `--validate` | Run validation (tests, lint, build) between iterations | `true` |
| `--max-iterations <n>` | Maximum loop iterations | auto-calculated |
| `--agent <name>` | Force a specific coding agent | auto-detected |

## Example Session

```bash
$ ralph-starter github

  GitHub to Code
  Build from GitHub issues in one command

? GitHub repository: acme/webapp
  Fetching open issues from acme/webapp...

  Select an issue:
  1) #42: Add user authentication [feature, auth]
  2) #38: Fix mobile navigation [bug, ui]
  3) #35: Add dark mode toggle [enhancement]
  4) #31: Improve test coverage [testing]

? Select issue (number): 1
  Selected: #42 — Add user authentication

? Tech stack? Next.js + TypeScript + Tailwind CSS (Detected)

  Which model?
  1) Claude Opus 4.6 — maximum quality (Recommended)
  2) Claude Sonnet 4.5 — fast + cost-effective
  3) Custom model ID
? Select model (number): 1

  Using: Claude Opus 4.6 — maximum quality (Recommended)

→ Fetching GitHub issue #42...
→ Loop 1/5: Generating auth module...
→ Loop 2/5: Adding tests and validation...
→ Validation passed: 12 tests, lint clean
✓ Done in 4m 18s | Cost: $0.38 | PR #87 created
```

## How It Works

The `github` command is a convenience wrapper around [`ralph-starter run`](/docs/cli/run). After collecting your inputs, it calls:

```bash
ralph-starter run "Using <stack>: Implement GitHub issue #<number>: <title>" \
  --from github \
  --project <owner/repo> \
  --issue <number> \
  --model <selected-model> \
  --auto \
  --validate
```

The `--auto` flag enables automatic mode so the wizard does not prompt for additional configuration. The `--validate` flag enables lint/build validation between iterations.

## Prerequisites

- **GitHub CLI** (`gh`): Install with `brew install gh` and authenticate with `gh auth login`
- **Repository access**: You must have read access to the target repository

## See Also

- [GitHub Source](/docs/sources/github) — Full GitHub integration reference (issues, PRs, files)
- [run](/docs/cli/run) — The underlying run command with all options
- [figma](/docs/cli/figma) — Similar wizard for Figma design-to-code
