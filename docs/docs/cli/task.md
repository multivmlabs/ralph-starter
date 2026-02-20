---
sidebar_position: 3
title: task
description: Manage tasks across GitHub and Linear
keywords: [cli, task, command, github, linear, issues, unified, assignee]
---

# ralph-starter task

Unified task management across GitHub and Linear. Issues stay where they are -- ralph-starter detects the platform from the ID format and routes operations accordingly.

## Synopsis

```bash
ralph-starter task list [options]
ralph-starter task create --title "..." [options]
ralph-starter task update <id> [options]
ralph-starter task close <id> [options]
ralph-starter task comment <id> "message" [options]
```

## Description

The `task` command provides a single interface for managing issues on both GitHub and Linear. Instead of switching between `gh issue` and Linear's UI, you can:

- **List** tasks from both platforms in a unified table
- **Create** issues on either platform
- **Update** status, priority, or assignee
- **Close** issues with optional comments
- **Comment** on issues

### Smart ID Detection

ralph-starter automatically detects which platform an issue belongs to based on the ID format:

| Format | Platform | Example |
|--------|----------|---------|
| `#123` or `123` | GitHub | `ralph-starter task close #42` |
| `TEAM-123` | Linear | `ralph-starter task update ENG-42 --status "In Progress"` |

You can always override detection with `--source github` or `--source linear`.

## Actions

### `task list`

List tasks from all configured integrations.

```bash
# List from all sources
ralph-starter task list

# List from GitHub only
ralph-starter task list --source github --project owner/repo

# List from Linear only
ralph-starter task list --source linear

# Filter by label and status
ralph-starter task list --label "bug" --status "open" --limit 10
```

### `task create`

Create a new issue on GitHub or Linear.

```bash
# Create on GitHub (default)
ralph-starter task create --title "Add dark mode" --project owner/repo

# Create on Linear
ralph-starter task create --title "Add dark mode" --source linear --priority P1

# Create with assignee and labels
ralph-starter task create --title "Fix auth bug" --source github \
  --project owner/repo --assignee octocat --label "bug,urgent"
```

### `task update`

Update an existing issue.

```bash
# Update status on Linear (auto-detected from ID)
ralph-starter task update ENG-42 --status "In Progress"

# Assign a task
ralph-starter task update ENG-42 --assignee ruben

# Update priority
ralph-starter task update ENG-42 --priority P0

# Update a GitHub issue
ralph-starter task update #123 --assignee octocat --project owner/repo
```

### `task close`

Close an issue with an optional comment.

```bash
# Close a Linear issue
ralph-starter task close ENG-42

# Close with a comment
ralph-starter task close #123 --comment "Fixed in PR #456" --project owner/repo
```

### `task comment`

Add a comment to an issue.

```bash
ralph-starter task comment ENG-42 "Working on this now"
ralph-starter task comment #123 "Needs design review" --project owner/repo
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--source <source>` | Filter by source: `github`, `linear`, or `all` | `all` (list) / `github` (create) |
| `--project <name>` | Project filter (`owner/repo` for GitHub, team name for Linear) | - |
| `--label <name>` | Filter by label or set labels (comma-separated) | - |
| `--status <status>` | Filter by status or set status on update | - |
| `--limit <n>` | Max tasks to fetch | `50` |
| `--title <title>` | Task title (for create) | - |
| `--body <body>` | Task description (for create) | - |
| `--priority <p>` | Priority: `P0`, `P1`, `P2`, `P3` | - |
| `--assignee <name>` | Assign to team member (GitHub username or Linear display name) | - |
| `--comment <text>` | Comment text (for close/update) | - |

## Assignee Resolution

### GitHub

Pass a GitHub username directly:

```bash
ralph-starter task update #123 --assignee octocat --project owner/repo
```

### Linear

ralph-starter resolves display names, full names, and email prefixes to Linear user IDs:

```bash
# Match by display name
ralph-starter task update ENG-42 --assignee "Ruben"

# Match by email prefix
ralph-starter task update ENG-42 --assignee "ruben"
```

Matching is case-insensitive. If no match is found, ralph-starter shows available team members.

## Prerequisites

At least one integration must be configured:

```bash
# GitHub (via GitHub CLI)
gh auth login

# Linear (via API key)
ralph-starter config set linear.apiKey lin_api_xxxxxxxxxxxx
```

Check integration status:

```bash
ralph-starter integrations list
```

## See Also

- [`ralph-starter auto`](auto.md) -- Batch-process tasks autonomously
- [`ralph-starter integrations`](integrations.md) -- Manage integrations
- [`ralph-starter auth`](auth.md) -- Authenticate with services
- [GitHub Source](../sources/github.md) -- GitHub integration details
- [Linear Source](../sources/linear.md) -- Linear integration details
