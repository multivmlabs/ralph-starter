---
slug: five-ai-coding-agents
title: I tried 5 AI coding agents with ralph-starter
authors: [ruben]
tags: [ralph-starter, agents, claude-code, cursor, codex, comparison]
image: /img/blog/ai-agents-comparison.png
---

ralph-starter works with multiple coding agents. I have used Claude Code, Cursor, Codex CLI, and OpenCode. At this post I will show you what I found.

<!-- truncate -->

ralph-starter auto-detects which agents you have installed. Checks in order: Claude Code, Cursor, Codex, OpenCode. Uses first one it finds, or you can specify:

```bash
ralph-starter run "your task" --agent claude-code
ralph-starter run "your task" --agent cursor
ralph-starter run "your task" --agent codex
```

![Agent comparison](/img/blog/ai-agents-comparison.png)

## Claude Code

The one I use daily. Fastest for autonomous loops because of prompt caching (90% less on input tokens after first loop) and stream-json output that lets ralph-starter track progress real time. Handles complex multi-file changes well.

`npm i -g @anthropic-ai/claude-code`

## Cursor

Good when you want IDE context. Strong at understanding project structure because it indexes workspace. More interactive by nature so autonomous mode requires more config. Best when you already work in Cursor.

## Codex CLI

OpenAI's agent. Solid for straightforward code generation. Supports `--auto-approve` for autonomous mode. Less aggressive about multi-file refactors compared to Claude Code but produces clean conservative code. Good if you prefer GPT-4 style.

`npm i -g codex`

## OpenCode

Newest option. Supports `--auto` for autonomous mode. Still maturing but shows promise, especially for projects that want to stay framework-agnostic.

`npm i -g opencode`

## What matters more

More than which agent you pick is how you configure the loop. Validation pipeline (tests, lint, build) catches mistakes regardless of agent. A weaker agent that iterates 5 times with test feedback produces better code than strong agent that runs once without validation.

My config:

```yaml
agent: claude-code
auto_commit: true
max_iterations: 50
validation:
  test: npm test
  build: npm run build
  lint: npm run lint
```

If one agent does not work for a task I switch. ralph-starter is agent-agnostic, loop executor and validation work the same regardless of which AI does the coding.

Start with what is on your machine. If you have nothing, go with Claude Code for best autonomous support and prompt caching.

## References

- [Agent configuration](/docs/cli/run)
- [ralph-starter init](/docs/cli/init)
