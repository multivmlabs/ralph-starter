---
slug: five-ai-coding-agents
title: I tried 5 AI coding agents with ralph-starter
authors: [ruben]
tags: [ralph-starter, agents, claude-code, cursor, codex, comparison]
description: I ran the same JWT auth task on Claude Code, Cursor, Codex CLI, and OpenCode. Real times, real costs, real results.
image: /img/ralph/5.jpg
---

ralph-starter works with multiple coding agents. I use Claude Code for basically everything, but I wanted to actually test the others on real tasks instead of just assuming. So I ran the same task on Claude Code, Cursor, Codex CLI, and OpenCode over the past few weeks. Some surprises, some not.

<!-- truncate -->

Quick note: ralph-starter auto-detects which agents you have installed. Checks in order: Claude Code, Cursor, Codex, OpenCode. Uses the first one it finds. You can also be explicit:

```bash
$ ralph-starter run "add pagination to /api/users" --agent claude-code

  Agent: Claude Code v1.0.16 (auto-detected)
  Mode: autonomous (--dangerously-skip-permissions)
  Output: stream-json

Loop 1/3
  Writing code with Claude Code...
```

Swapping agents is just a flag:

```bash
ralph-starter run "your task" --agent claude-code
ralph-starter run "your task" --agent cursor
ralph-starter run "your task" --agent codex
```

For this comparison I ran the same task -- "add JWT auth middleware with tests" -- on each agent. Same project, same spec, same validation pipeline. Tried to make it as fair as possible.

## Claude Code

My daily driver, and honestly it's not close. Fastest for autonomous loops because of [prompt caching](/blog/prompt-caching-saved-me-47-dollars) -- 90% less on input tokens after the first loop -- and the stream-json output lets ralph-starter track progress in real time. But the real reason I keep coming back: it just handles multi-file changes without flinching. Create a middleware file, write tests for it, update 3 route files, wire it all together. Done. Other agents sometimes get nervous about touching too many files.

```bash
$ ralph-starter run "add JWT auth middleware" --agent claude-code --loops 3 --test

Done in 1m 22s | Cost: $0.28 | Loops: 2/3
```

`npm i -g @anthropic-ai/claude-code`

## Cursor

Cursor is good if you're already living in the Cursor IDE. It indexes your workspace, so it knows your project structure out of the box. The catch is it's more interactive by nature -- autonomous mode requires some extra config to work smoothly.

```bash
$ ralph-starter run "add JWT auth middleware" --agent cursor --loops 3 --test

Done in 2m 48s | Cost: $0.41 | Loops: 3/3
```

Slower and 46% more expensive than Claude Code on the same task. It needed all 3 loops to finish. Got there eventually, but I wouldn't pick it for batch processing a bunch of issues. If you're already a Cursor user and want to stay in that ecosystem, it works. Otherwise I'd go with Claude Code.

## Codex CLI

OpenAI's entry. It supports `--auto-approve` for autonomous mode, which is nice. The code it produces is clean and conservative -- it's the "measure twice, cut once" agent. Doesn't try to do too much at once. The flip side is it won't tackle big multi-file refactors the way Claude Code will. It kind of plays it safe, which is fine for straightforward features but frustrating when you need it to be bold.

```bash
$ ralph-starter run "add JWT auth middleware" --agent codex --loops 3 --test

Done in 2m 15s | Cost: $0.35 | Loops: 2/3
```

`npm i -g codex`

## OpenCode

The newest one, and it supports `--auto` for autonomous mode. I'll be real: it's the least polished of the bunch right now. I've gotten decent results on smaller, focused tasks -- single-file stuff, utility functions, that kind of thing. But the JWT middleware task tripped it up because it needed to coordinate changes across multiple files. It kept getting confused about which file it had already edited. Still early days though, and it's improving fast.

`npm i -g opencode`

## Here's the thing though

After running all these comparisons, the honest truth is: the validation pipeline matters way more than which agent you pick. Tests, lint, build -- those catch mistakes regardless of who wrote the code. A weaker agent that iterates 5 times with test feedback produces better code than a strong agent running once with no tests. Every time. The loop is the product, not the agent. That's the whole [Ralph Wiggum technique](/blog/ralph-wiggum-technique).

My actual config:

```yaml
agent: claude-code
auto_commit: true
max_iterations: 50
validation:
  test: npm test
  build: npm run build
  lint: npm run lint
```

If one agent doesn't work for a task, I just switch. ralph-starter is agent-agnostic on purpose -- the loop executor and validation pipeline work the same regardless of which AI is doing the coding.

My honest advice? If you're starting fresh, install Claude Code. It's what I use for 95% of my work, the [prompt caching](/blog/prompt-caching-saved-me-47-dollars) makes it the cheapest option for loops, and it handles multi-file tasks better than anything else I've tried. If you already have something installed, start with that. Don't overthink it.

```bash
npx ralph-starter init
```

It'll detect what you have and set things up. Pick one and start looping.

## References

- [The Ralph Wiggum technique](/blog/ralph-wiggum-technique)
- [Prompt caching saved me $47](/blog/prompt-caching-saved-me-47-dollars)
- [ralph-starter + Claude Code: the full setup](/blog/ralph-starter-claude-code-setup)
- [Agent configuration docs](/docs/cli/run)
- [ralph-starter init docs](/docs/cli/init)
