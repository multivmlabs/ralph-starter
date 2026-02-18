---
slug: my-first-ralph-loop
title: "My first ralph loop: what actually happens"
authors: [ruben]
tags: [ralph-starter, tutorial, loops, getting-started]
image: /img/blog/first-ralph-loop.png
---

People ask me what happens when you run a ralph loop. At this post I will show you a real one.

<!-- truncate -->

You want to add a dark mode toggle. You run:

```bash
ralph-starter run "add dark mode toggle to settings page" --loops 5 --test --lint --commit
```

First ralph-starter detects your coding agent. Prefers Claude Code but works with Cursor, Codex, OpenCode too. Then reads `AGENTS.md` to find your test/lint/build commands.

Loop 1 starts. Agent gets the task with project context, reads files, creates components. First pass usually gets the structure right but something breaks.

![Terminal showing ralph loop iterations](/img/blog/first-ralph-loop.png)

```
Loop 1/5 → tests failed (1 failure)
Loop 2/5 → tests passed, lint failed (2 issues)
Loop 3/5 → all validation passed ✓
```

Test failure goes back as context for loop 2. Agent sees the exact error and fixes. Loop 2 passes tests but lint complains. Loop 3 fixes that too.

Three loops. About 90 seconds. The other 2 never run because task completed early.

You also get a cost summary at the end:

```
Cost Summary:
  Tokens: 45K (32K in / 13K out)
  Cost: $0.29 (3 iterations)
  Cache savings: $0.12
```

There is a circuit breaker too. If agent fails the same way 3 times it stops, does not burn tokens on something that is stuck.

Try yourself:

```bash
npm i -g ralph-starter
ralph-starter init
ralph-starter run "your first task" --loops 3 --test
```

## More

- [Loop executor docs](/docs/cli/run)
- [Circuit breaker](/docs/advanced/circuit-breaker)
- [Validation pipeline](/docs/advanced/validation)
