---
slug: spec-driven-development-ralph-starter
title: Spec Driven Development with ralph-starter
authors: [ruben]
tags: [ralph-starter, sdd, openspec, specs, workflow]
description: How ralph-starter brings Spec Driven Development to any AI coding agent, with native OpenSpec support, spec validation, and multi-source spec fetching.
image: /img/blog/sdd-ralph-starter.png
---

Spec Driven Development is the biggest shift in AI coding since agents learned to run tests. Here is how ralph-starter fits in.

<!-- truncate -->

## The problem with "just prompt it"

Most people use AI coding agents the same way: type a sentence, hit enter, hope for the best. "Add user auth." "Fix the sidebar." Three words and vibes.

I did this for weeks. The agent would generate something that looked plausible but missed what I actually wanted. I blamed the tool, but the problem was me. I was not giving it enough context.

Then I started writing specs -- not essays, just 10-20 lines describing what I actually wanted, how to verify it, and where things should go. The difference was night and day. 2 loops instead of 5. $0.50 instead of $3. Correct output instead of close-but-wrong.

This pattern has a name now: **Spec Driven Development (SDD)**.

## The SDD landscape

Three frameworks are leading the SDD conversation:

| Tool | Philosophy | Lock-in |
|------|-----------|---------|
| **OpenSpec** (Fission AI) | Lightweight, fluid, tool-agnostic | None |
| **Spec-Kit** (GitHub) | Heavyweight, rigid 5-phase gates | GitHub ecosystem |
| **Kiro** (AWS) | Full IDE with built-in agents | AWS account required |

OpenSpec organizes specs into changes with `proposal.md`, `design.md`, `tasks.md`, and requirement specs using RFC 2119 keywords (SHALL, MUST, SHOULD). It is the lightest of the three.

Spec-Kit enforces five phases: constitution, specification, plan, tasks, implement. Thorough but heavy.

Kiro bundles everything into a VS Code fork with agent hooks and EARS notation. Powerful but locked to AWS.

## Where ralph-starter fits

ralph-starter takes a different angle: **your specs already exist somewhere**.

They are in GitHub Issues. Linear tickets. Notion docs. Figma designs. OpenSpec directories. Why rewrite them in a new format?

ralph-starter pulls specs from where they already live:

```bash
# From GitHub issues
ralph-starter run --from github --project myorg/myrepo --label "ready"

# From OpenSpec directories
ralph-starter run --from openspec:add-auth

# From Linear tickets
ralph-starter run --from linear --project "Mobile App"

# From a Notion doc
ralph-starter run --from notion --project "https://notion.so/spec-abc123"
```

Then it runs autonomous loops: build context, spawn agent, collect output, run validation (lint/build/test), commit, repeat until done.

## New in v0.5.0: OpenSpec + spec validation

We just shipped native OpenSpec support and a spec validator:

```bash
# List all OpenSpec changes in the project
ralph-starter spec list

# Validate spec completeness (0-100 score)
ralph-starter spec validate

# Validate before running -- stops if spec is too thin
ralph-starter run --from openspec:my-feature --spec-validate
```

The validator checks for:
- Proposal or rationale section (why are we building this?)
- RFC 2119 keywords (SHALL, MUST -- formal requirements)
- Given/When/Then acceptance criteria (testable conditions)
- Design section (how to build it)
- Task breakdown (implementation steps)

A spec scoring below 40/100 gets flagged before the agent starts. This saves tokens on underspecified work.

## The new spec command

`ralph-starter spec` gives you a CLI for spec operations:

```bash
# Validate all specs in the project
ralph-starter spec validate

# List available specs (auto-detects OpenSpec, Spec-Kit, or raw)
ralph-starter spec list

# Show completeness summary
ralph-starter spec summary
```

It auto-detects whether you are using OpenSpec format, GitHub Spec-Kit format, or plain markdown specs.

## The numbers

| Metric | Without specs | With specs |
|--------|--------------|------------|
| Loops per task | 5 | 2 |
| Cost per task | ~$3.00 | ~$0.50 |
| Output accuracy | Hit or miss | Consistent |
| Time writing spec | 0 min | 3 min |

The 3 minutes spent writing a spec save 15 minutes of iteration and debugging. The spec is the leverage.

## What is next

We are working on:
- **Spec coverage tracking** -- which requirements have been implemented?
- **Spec-to-test generation** -- Given/When/Then to test stubs
- **Living specs** -- specs that update as implementation diverges

SDD is not a fad. It is the natural evolution of AI-assisted coding. The spec is the interface between human intent and machine execution. The clearer the spec, the better the output.

ralph-starter is open source, MIT licensed: [github.com/multivmlabs/ralph-starter](https://github.com/multivmlabs/ralph-starter)
