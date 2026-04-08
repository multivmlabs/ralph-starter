---
sidebar_position: 7
title: Spec Driven Development
description: How ralph-starter implements Spec Driven Development for AI coding agents
keywords: [sdd, spec driven development, openspec, spec-kit, specs, workflow]
---

# Spec Driven Development

Spec Driven Development (SDD) is a methodology where you write a structured specification before any code is generated. The spec becomes the contract between human intent and AI execution.

ralph-starter is built around this principle: **pull specs from where they already live, validate them, then run autonomous loops until done.**

## Why specs matter for AI coding

Without a spec, AI agents guess. A vague prompt like "add authentication" produces plausible but wrong code. You waste iterations fixing misunderstandings.

With a clear spec:
- **2 loops** instead of 5
- **$0.50** instead of $3+
- **Correct output** instead of close-but-wrong

The spec is the highest-leverage investment in any AI coding workflow.

## How ralph-starter does SDD

```
Spec → Validate → Plan → Agent builds → Lint/Build/Test → Commit → PR
```

### 1. Pull specs from any source

Your specs already exist somewhere. ralph-starter fetches them:

```bash
# From OpenSpec directories
ralph-starter run --from openspec:add-auth

# From GitHub issues
ralph-starter run --from github --project myorg/api --label ready

# From Linear tickets
ralph-starter run --from linear --project "Backend"

# From Notion docs
ralph-starter run --from notion --project "https://notion.so/spec-abc"

# From Figma designs
ralph-starter figma
```

### 2. Validate before building

The `--spec-validate` flag checks completeness before spending tokens:

```bash
ralph-starter run --from openspec:add-auth --spec-validate
```

The validator scores specs 0-100 based on:

| Check | Points | What it looks for |
|-------|--------|-------------------|
| Proposal/rationale | 20 | `## Proposal`, `## Why`, `## Overview` section |
| RFC 2119 keywords | 25 / 10 | 25 if SHALL, MUST, SHOULD, MAY present; 10 partial credit if absent but content >200 chars |
| Design section | 15 | `## Design`, `## Architecture`, `## Technical` |
| Task breakdown | 15 | `## Tasks` or `- [ ]` checklists |
| Acceptance criteria | 15 | Given/When/Then blocks |
| Content depth | 10 / 5 | 10 if >= 500 chars; 5 if 200-499 chars |

Specs scoring below 40/100 are flagged before the loop starts.

### 3. Autonomous execution

Once validated, ralph-starter runs the loop:
1. Build iteration context from spec + plan
2. Spawn the AI agent with trimmed prompt
3. Collect agent output
4. Run validation (lint, build, tests)
5. If validation fails, feed errors back to agent
6. If validation passes, commit
7. Repeat until task is complete

## The `spec` command

ralph-starter includes a dedicated CLI for spec operations:

```bash
# Validate all specs in the project
ralph-starter spec validate

# List available specs (auto-detects format)
ralph-starter spec list

# Show completeness metrics
ralph-starter spec summary
```

It auto-detects **OpenSpec**, **Spec-Kit**, or **raw markdown** format.

## Comparison: ralph-starter vs other SDD tools

| Capability | ralph-starter | OpenSpec | Spec-Kit | Kiro |
|-----------|--------------|---------|---------|------|
| **Spec format** | Any (OpenSpec, Spec-Kit, raw, GitHub, Linear, Notion, Figma) | OpenSpec only | Spec-Kit only | EARS notation |
| **Execution** | Fully autonomous loops | Manual (`/opsx:apply`) | Manual per phase | IDE-integrated agents |
| **Agent support** | Claude Code, Cursor, Codex, OpenCode, Amp | Any chat agent | Any chat agent | Kiro agents only |
| **Validation** | Lint + build + test + visual | None | None | Agent hooks |
| **Spec validation** | 0-100 scoring with RFC 2119 check | Zod schema | Phase gates | Auto-generated |
| **Multi-source** | GitHub, Linear, Notion, Figma, OpenSpec, URLs, files | Local filesystem | Local filesystem | IDE workspace |
| **Cost tracking** | Per-iteration token + cost tracking | N/A | N/A | Subscription model |
| **Lock-in** | None (CLI, any OS) | None | GitHub ecosystem | AWS account required |
| **Pricing** | Free + pay-per-API | Free | Free | $19-39/month |

## Writing good specs

A spec does not need to be long. 10-20 lines is enough:

```markdown
## Proposal

Add JWT authentication to the Express API.

## Requirements

- POST /api/auth/login takes { email, password }, validates against users table
- Return { token, expiresIn } on success, 401 with { error } on failure
- Token TTL: 24h
- Auth middleware in src/middleware/auth.ts (Authorization: Bearer header)
- The API MUST reject expired tokens with 401
- The API SHALL rate-limit login attempts to 5/minute per IP

## Tasks

- [ ] Create auth middleware
- [ ] Add login endpoint
- [ ] Add token refresh endpoint
- [ ] Write tests

## Acceptance Criteria

Given: A user with valid credentials
When: They POST to /api/auth/login
Then: They receive a JWT token with 24h TTL

Given: A request with an expired token
When: It hits a protected endpoint
Then: The API returns 401 Unauthorized
```

This spec takes 3 minutes to write. It tells the agent exactly what to build, where to put it, and how to verify it works.

## Supported spec formats

### OpenSpec

```
openspec/
├── changes/
│   └── add-auth/
│       ├── proposal.md
│       ├── design.md
│       ├── tasks.md
│       └── specs/
│           └── auth/
│               └── spec.md
└── specs/
    └── api/
        └── spec.md
```

```bash
ralph-starter run --from openspec:add-auth
```

### Spec-Kit (GitHub)

```
specs/
├── constitution.md
├── specification.md
├── plan.md
└── tasks.md
```

```bash
ralph-starter spec validate   # auto-detects Spec-Kit format
```

### Raw markdown

```
specs/
├── auth-spec.md
├── api-spec.md
└── db-migration.md
```

```bash
ralph-starter run --from ./specs/auth-spec.md
```

## Next steps

- [OpenSpec source docs](/docs/sources/openspec) -- How to use OpenSpec with ralph-starter
- [Spec CLI reference](/docs/cli/spec) -- Full `ralph-starter spec` command docs
- [Workflow presets](/docs/guides/workflow-presets) -- Pre-configured SDD presets
