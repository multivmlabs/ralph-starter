---
sidebar_position: 6
title: OpenSpec
description: Read specs from OpenSpec change directories
keywords: [openspec, spec driven development, sdd, source, integration]
---

# OpenSpec Source

Read structured specifications from [OpenSpec](https://github.com/Fission-AI/OpenSpec) change directories. No authentication required -- reads directly from the local filesystem.

## What is OpenSpec?

OpenSpec is a spec-driven development framework that organizes specs into a structured directory:

```
openspec/
├── config.yaml
├── changes/
│   ├── add-auth/
│   │   ├── proposal.md       # Why: rationale and scope
│   │   ├── design.md         # How: technical approach
│   │   ├── tasks.md          # What: implementation checklist
│   │   └── specs/
│   │       └── auth/
│   │           └── spec.md   # Requirements with SHALL/MUST keywords
│   └── archive/              # Completed changes
└── specs/                    # Global specifications
    └── api/
        └── spec.md
```

## Usage

### Fetch a specific change

```bash
ralph-starter run --from openspec:add-auth
```

This reads `proposal.md` + `design.md` + `tasks.md` + all `specs/*/spec.md` from the `add-auth` change and feeds them as a single structured spec to the AI agent.

### List available changes

```bash
ralph-starter run --from openspec
# or
ralph-starter run --from openspec:list
```

Returns a summary of all active (non-archived) changes with their available files.

### Fetch all active changes

```bash
ralph-starter run --from openspec:all
```

Concatenates all active changes into one document, separated by horizontal rules.

### Fetch global specs only

```bash
ralph-starter run --from openspec:specs
# or
ralph-starter run --from openspec:global
```

Reads only the `openspec/specs/*/spec.md` files (not change-specific specs).

### Validate before running

```bash
ralph-starter run --from openspec:add-auth --spec-validate
```

Checks spec completeness (0-100 score) before starting the loop. See [Spec Driven Development](/docs/guides/spec-driven-development) for scoring details.

## Spec CLI

Use the `spec` command for standalone operations:

```bash
# Validate all OpenSpec changes
ralph-starter spec validate

# List available specs
ralph-starter spec list

# Show completeness metrics
ralph-starter spec summary
```

## Output format

When ralph-starter reads an OpenSpec change, it produces structured markdown:

```markdown
# OpenSpec Change: add-auth

## Proposal
[contents of proposal.md]

## Design
[contents of design.md]

## Tasks
[contents of tasks.md]

## Specs
### auth
[contents of specs/auth/spec.md]
```

Missing files are silently skipped -- if there is no `design.md`, the Design section is omitted.

## Metadata

The source returns metadata useful for downstream processing:

| Field | Description |
|-------|-------------|
| `type` | Always `"openspec"` |
| `changeName` | Name of the change directory |
| `files` | List of files read (relative paths) |
| `hasProposal` | Whether `proposal.md` exists |
| `hasDesign` | Whether `design.md` exists |
| `hasTasks` | Whether `tasks.md` exists |
| `specAreas` | List of spec area names (e.g., `["auth", "api"]`) |

## Getting started with OpenSpec

If you do not have an `openspec/` directory yet:

```bash
# Install OpenSpec
npm install -g openspec

# Initialize in your project
openspec init

# Create a new change
openspec propose add-auth
```

Then use ralph-starter to implement it:

```bash
ralph-starter run --from openspec:add-auth --commit --pr
```

## See also

- [Spec Driven Development guide](/docs/guides/spec-driven-development) -- Full SDD workflow
- [Spec CLI reference](/docs/cli/spec) -- `ralph-starter spec` command
- [OpenSpec GitHub](https://github.com/Fission-AI/OpenSpec) -- OpenSpec framework
