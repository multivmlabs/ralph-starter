---
slug: five-ai-coding-agents
title: I tried 5 AI coding agents with ralph-starter
authors: [ruben]
tags: [ralph-starter, agents, claude-code, cursor, codex, comparison]
image: /img/blog/ai-agents-comparison.png
---

ralph-starter works with multiple coding agents. I have actually tried Claude Code, Cursor, Codex CLI, and OpenCode on real tasks over the past few weeks. Here is what I found -- no marketing, just my honest experience.

<!-- truncate -->

First thing: ralph-starter auto-detects which agents you have installed. It checks in order: Claude Code, Cursor, Codex, OpenCode. Uses the first one it finds. But you can also be explicit:

```bash
$ ralph-starter run "add pagination to /api/users" --agent claude-code

  Agent: Claude Code v1.0.16 (auto-detected)
  Mode: autonomous (--dangerously-skip-permissions)
  Output: stream-json

🔄 Loop 1/3
  → Writing code with Claude Code...
```

You can swap agents any time:

```bash
ralph-starter run "your task" --agent claude-code
ralph-starter run "your task" --agent cursor
ralph-starter run "your task" --agent codex
```

![Agent comparison](/img/blog/ai-agents-comparison.png)

I ran the same task -- "add JWT auth middleware with tests" -- on each agent. Same project, same spec, same validation pipeline. Here is what happened.

## Claude Code

The one I use daily. Not even close. Fastest for autonomous loops because of [prompt caching](/blog/prompt-caching-saved-me-47-dollars) (90% less on input tokens after the first loop) and stream-json output that lets ralph-starter track progress in real time. Handles complex multi-file changes well. When it needs to create a middleware file, a test file, and update 3 route files -- it just does it.

```bash
$ ralph-starter run "add JWT auth middleware" --agent claude-code --loops 3 --test

✅ Done in 1m 22s | Cost: $0.28 | Loops: 2/3
```

`npm i -g @anthropic-ai/claude-code`

## Cursor

Good when you want IDE context. Strong at understanding project structure because it indexes your workspace. More interactive by nature, so autonomous mode requires a bit more config. Best when you already work in Cursor and want the AI to understand your open files and recent edits.

```bash
$ ralph-starter run "add JWT auth middleware" --agent cursor --loops 3 --test

✅ Done in 2m 48s | Cost: $0.41 | Loops: 3/3
```

Took an extra loop, but got there.

## Codex CLI

OpenAI's agent. Solid for straightforward code generation. Supports `--auto-approve` for autonomous mode. Less aggressive about multi-file refactors compared to Claude Code but produces clean, conservative code. Good if you prefer the GPT-4 style -- careful, methodical.

```bash
$ ralph-starter run "add JWT auth middleware" --agent codex --loops 3 --test

✅ Done in 2m 15s | Cost: $0.35 | Loops: 2/3
```

`npm i -g codex`

## OpenCode

Newest option. Supports `--auto` for autonomous mode. Still maturing but shows promise, especially for projects that want to stay framework-agnostic. I have had good results on smaller, focused tasks.

`npm i -g opencode`

## What actually matters more than the agent

Here is the thing I keep coming back to. More than which agent you pick, what matters is how you configure the loop. The validation pipeline (tests, lint, build) catches mistakes regardless of which agent wrote the code. A weaker agent that iterates 5 times with test feedback produces better code than a strong agent that runs once without validation. That is the whole [Ralph Wiggum technique](/blog/ralph-wiggum-technique) -- the loop is the product, not the agent.

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

If one agent does not work for a task, I switch. ralph-starter is agent-agnostic -- the loop executor and validation pipeline work the same regardless of which AI does the coding. That is by design.

My advice? Start with whatever is already on your machine. If you have nothing installed and want the best autonomous experience with [prompt caching](/blog/prompt-caching-saved-me-47-dollars), go with Claude Code. But do not overthink it.

```bash
npx ralph-starter init
```

It will detect what you have and set things up. Like Ralph says, *"I picked Nelson!"* -- just pick one and start looping.

## References

- [The Ralph Wiggum technique](/blog/ralph-wiggum-technique)
- [Prompt caching saved me $47](/blog/prompt-caching-saved-me-47-dollars)
- [ralph-starter + Claude Code: the full setup](/blog/ralph-starter-claude-code-setup)
- [Agent configuration docs](/docs/cli/run)
- [ralph-starter init docs](/docs/cli/init)
