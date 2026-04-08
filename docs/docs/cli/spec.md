---
sidebar_position: 15
title: spec
description: Validate, list, and summarize specs
keywords: [cli, spec, validate, sdd, spec driven development]
---

# ralph-starter spec

Validate, list, and summarize specs for spec-driven development workflows.

## Synopsis

```bash
ralph-starter spec <action> [options]
```

## Actions

### validate

Validate spec completeness across the project.

```bash
ralph-starter spec validate
ralph-starter spec validate --path openspec/changes/add-auth
```

Auto-detects the spec format (OpenSpec, Spec-Kit, or raw markdown) and validates each spec against a 0-100 completeness score.

**Checks performed:**

| Check | Points | Description |
|-------|--------|-------------|
| Proposal | 20 | Has a proposal, rationale, or overview section |
| RFC 2119 | 25 | Contains SHALL, MUST, SHOULD, or MAY keywords |
| Design | 15 | Has a design, architecture, or technical section |
| Tasks | 15 | Has a tasks section or checkbox items |
| Criteria | 15 | Has Given/When/Then acceptance criteria |
| Depth | 10 | At least 500 characters of content |

Specs scoring below 40 are flagged as failing.

### list

List available specs from any detected source.

```bash
ralph-starter spec list
```

Outputs all discovered specs with their available files.

### summary

Show spec completeness metrics.

```bash
ralph-starter spec summary
```

Displays format, change count, average completeness score.

## Options

| Option | Description |
|--------|-------------|
| `--path <path>` | Path to a specific spec file or directory to validate |

## Examples

```bash
# Validate all specs in an OpenSpec project
ralph-starter spec validate
#   PASS add-auth (85/100)
#   FAIL fix-login (30/100)
#        No acceptance criteria found.

# Validate a specific file
ralph-starter spec validate --path specs/api-spec.md

# Quick overview
ralph-starter spec summary
#   Format:  OpenSpec
#   Changes: 3 active, 1 archived
#   Specs:   5 global
#   Average: 72/100 completeness
```

## See also

- [Spec Driven Development guide](/docs/guides/spec-driven-development)
- [OpenSpec source](/docs/sources/openspec)
- [run --spec-validate](/docs/cli/run) -- Validate before running a loop
