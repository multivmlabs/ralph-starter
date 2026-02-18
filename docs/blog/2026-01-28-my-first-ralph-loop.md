---
slug: my-first-ralph-loop
title: "My first ralph loop: what actually happens"
authors: [ruben]
tags: [ralph-starter, tutorial, loops, getting-started]
image: /img/blog/first-ralph-loop.png
---

People ask me all the time: "what actually happens when you run a ralph loop?" Fair question. It sounds like magic when I say "I type one command and get a PR." So let me walk you through a real one.

<!-- truncate -->

Say you want to add a dark mode toggle to your settings page. Nothing crazy, but enough to touch a few files. You run:

```bash
ralph-starter run "add dark mode toggle to settings page" --loops 5 --test --lint --commit
```

First thing ralph-starter does is detect your coding agent. It prefers Claude Code but works with Cursor, Codex, OpenCode too. Then it reads your `AGENTS.md` to find your test/lint/build commands. No guessing -- it knows how *your* project validates code.

Loop 1 starts. The agent gets the task with full project context, reads your files, creates the components. First pass usually gets the structure right but something breaks. And you know what? That is completely fine. That is the whole point of loops.

![Terminal showing ralph loop iterations](/img/blog/first-ralph-loop.png)

Here is what the real terminal output looked like:

```bash
$ ralph-starter run "add dark mode toggle to settings page" --loops 5 --test --lint --commit

🔄 Loop 1/5
  → Planning implementation...
  → Writing code with Claude Code...
  → Running tests... 2 passed, 1 failed
  → Test failure: ThemeContext is not exported from './contexts'

🔄 Loop 2/5
  → Fixing: adding ThemeContext export...
  → Running tests... 3 passed ✓
  → Running lint... 2 issues found

🔄 Loop 3/5
  → Fixing lint issues (unused import, missing type)...
  → Running tests... 3 passed ✓
  → Running lint... clean ✓
  → Committing changes...

✅ Done in 1m 32s | Cost: $0.29 | Tokens: 45,218
```

Test failure goes back as context for loop 2. Agent sees the exact error -- `ThemeContext is not exported` -- and fixes it. Loop 2 passes tests but lint complains about an unused import. Loop 3 cleans that up.

Three loops. About 90 seconds. The other 2 loops never run because the task completed early. ralph-starter is smart enough to stop when everything passes. No wasted tokens.

You also get a cost summary at the end:

```
Cost Summary:
  Tokens: 45K (32K in / 13K out)
  Cost: $0.29 (3 iterations)
  Cache savings: $0.12
```

29 cents for a feature with tests that pass and clean lint. I used to spend 20 minutes doing this exact thing by hand.

There is a circuit breaker too. If the agent fails the same way 3 consecutive times, it stops. Does not keep burning tokens on something that is stuck. As Ralph Wiggum would say, *"I bent my Wookiee"* -- sometimes you just have to stop and try a different approach.

Want to try it yourself?

```bash
npm i -g ralph-starter
ralph-starter init
ralph-starter run "your first task" --loops 3 --test
```

That is it. Three commands and you are in the loop. If you want to understand [why I built this in the first place](/blog/why-i-built-ralph-starter), I wrote about that too.

## References

- [Why I built ralph-starter](/blog/why-i-built-ralph-starter)
- [ralph-starter + Claude Code: the full setup](/blog/ralph-starter-claude-code-setup)
- [Loop executor docs](/docs/cli/run)
- [Circuit breaker](/docs/advanced/circuit-breaker)
- [Validation pipeline](/docs/advanced/validation)
