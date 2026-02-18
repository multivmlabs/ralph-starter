---
slug: ralph-starter-claude-code-setup
title: "ralph-starter + Claude Code: the full setup"
authors: [ruben]
tags: [ralph-starter, claude-code, setup, tutorial]
image: /img/blog/claude-code-setup.png
---

At this post I will show you how to setup ralph-starter with Claude Code from zero to your first automated PR.

<!-- truncate -->

Claude Code is the best agent I use with ralph-starter. Prompt caching makes loops cheap and stream-json output lets ralph-starter track progress real time.

## Install

```bash
npm i -g @anthropic-ai/claude-code
npm i -g ralph-starter
```

You need `ANTHROPIC_API_KEY` in your environment. Check with `claude --version`.

## Init

```bash
cd your-project
ralph-starter init
```

![ralph-starter init output](/img/blog/claude-code-setup.png)

This detects your project type (Node, Python, Rust, Go) and reads `package.json` to find test/build/lint commands. Creates:

- `AGENTS.md` with validation commands
- `PROMPT_build.md` and `PROMPT_plan.md` for agent behavior
- `.ralph/config.yaml`

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

```bash
ralph-starter run "add a health check endpoint at /api/health" --loops 3 --test --commit
```

ralph-starter launches Claude Code with `--dangerously-skip-permissions` for autonomous mode and `--output-format stream-json` for real time tracking.

After loop 1 your context gets cached. Loops 2, 3, 4 reuse the cache at 90% less cost. On a 5-loop task you pay full price only first iteration.

## Auto PRs from GitHub

```bash
gh auth login
ralph-starter run --from github --project myorg/myrepo --issue 42 --commit --pr
```

Creates branch, runs loops, commits, pushes, opens PR. For multiple issues at once:

```bash
ralph-starter auto --source github --project myorg/myrepo --label "auto-ready" --limit 5
```

I label issues "auto-ready" when they have clear specs and run this once or twice a week.

## Tip

Add specific context in `.claude/CLAUDE.md`. Things like "we use Tailwind", "tests in `__tests__/`", "follow pattern in `src/api/`". More specific you are, better the output gets.

## References

- [Claude Code docs](https://docs.anthropic.com/en/docs/claude-code)
- [ralph-starter CLI](/docs/cli/run)
- [Cost tracking](/docs/guides/cost-tracking)
