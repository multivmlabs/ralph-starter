---
slug: ralph-starter-claude-code-setup
title: "ralph-starter + Claude Code: the full setup"
authors: [ruben]
tags: [ralph-starter, claude-code, setup, tutorial]
description: Zero to your first automated PR with ralph-starter and Claude Code. Install, init, run, and get a working PR in under 2 minutes.
image: /img/blog/claude-code-setup.png
---

I wanted to write the post I wish existed when I started: how to go from zero to your first automated PR with ralph-starter and Claude Code. No fluff, just the steps.

<!-- truncate -->

Claude Code is the best agent I use with ralph-starter. Prompt caching makes loops cheap, stream-json output lets ralph-starter track progress in real time, and it handles multi-file changes without breaking a sweat.

## Install

```bash
npm i -g @anthropic-ai/claude-code
npm i -g ralph-starter
```

You need `ANTHROPIC_API_KEY` in your environment. Quick sanity check:

```bash
$ claude --version
claude-code 1.0.16

$ ralph-starter --version
ralph-starter 0.6.2
```

If both work, you are ready.

## Init

```bash
$ cd your-project
$ ralph-starter init

  Detected: Node.js project (package.json found)
  Agent: Claude Code (claude-code v1.0.16)

  Created:
    ✓ AGENTS.md — validation commands
    ✓ PROMPT_build.md — agent build instructions
    ✓ PROMPT_plan.md — planning phase prompt
    ✓ .ralph/config.yaml — project config

  Run your first task:
    ralph-starter run "your task" --loops 3 --test
```

This detects your project type (Node, Python, Rust, Go) and reads `package.json` to find test/build/lint commands. Creates a few files:

- `AGENTS.md` with validation commands
- `PROMPT_build.md` and `PROMPT_plan.md` for agent behavior
- `.ralph/config.yaml`

The config is straightforward:

```yaml
agent: claude-code
auto_commit: true
max_iterations: 50
validation:
  test: npm test
  build: npm run build
  lint: npm run lint
```

## First task

Pick something small for your first run:

```bash
$ ralph-starter run "add a health check endpoint at /api/health" --loops 3 --test --commit

🔄 Loop 1/3
  → Writing code with Claude Code...
  → Created: src/api/health.ts, src/api/__tests__/health.test.ts
  → Running tests... 5 passed ✓
  → Committing changes...

✅ Done in 47s | Cost: $0.11 | Tokens: 8,924
```

47 seconds. 11 cents. A working health endpoint with tests.

Under the hood, ralph-starter launches Claude Code with `--dangerously-skip-permissions` for autonomous mode and `--output-format stream-json` so it can track progress in real time. You do not need to know this, but I think it is cool.

After loop 1 your context gets cached. Loops 2, 3, 4 reuse that cache at 90% less cost. On a 5-loop task you pay full price only on the first iteration. I wrote more about this in [prompt caching saved me $47](/blog/prompt-caching-saved-me-47-dollars).

## Auto PRs from GitHub

You can also go straight from a GitHub issue to a PR:

```bash
$ gh auth login
$ ralph-starter run --from github --project myorg/myrepo --issue 42 --commit --pr

🔄 Loop 1/5
  → Fetching spec from GitHub issue #42...
  → "Add rate limiting to /api/users endpoint"
  → Writing code with Claude Code...
  → Running tests... 7 passed, 1 failed

🔄 Loop 2/5
  → Fixing: rate limit header format...
  → Running tests... 8 passed ✓
  → Committing changes...
  → Opening PR #87...

✅ Done in 2m 12s | Cost: $0.19 | Tokens: 18,340
```

Creates branch, runs loops, commits, pushes, opens PR. For multiple issues at once:

```bash
ralph-starter auto --source github --project myorg/myrepo --label "auto-ready" --limit 5
```

I label issues "auto-ready" when they have clear specs and [run this once or twice a week](/blog/automating-entire-workflows).

## One thing that made a big difference

Add specific context in `.claude/CLAUDE.md`. Things like "we use Tailwind", "tests in `__tests__/`", "follow pattern in `src/api/`". The more specific you are, the better the output gets. I have seen first-loop success rate go from maybe 40% to 70% just by adding a few lines of project context.

Ready to try it?

```bash
npx ralph-starter init
```

## References

- [Why I built ralph-starter](/blog/why-i-built-ralph-starter)
- [My first ralph loop](/blog/my-first-ralph-loop)
- [Prompt caching saved me $47](/blog/prompt-caching-saved-me-47-dollars)
- [Claude Code docs](https://docs.anthropic.com/en/docs/claude-code)
- [ralph-starter CLI reference](/docs/cli/run)
- [Cost tracking guide](/docs/guides/cost-tracking)
