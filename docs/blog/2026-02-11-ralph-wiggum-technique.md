---
slug: ralph-wiggum-technique
title: Ralph Wiggum technique explained in 2 minutes
authors: [ruben]
tags: [ralph-wiggum, technique, ai-coding, autonomous]
description: The Ralph Wiggum technique is running AI coding agents in loops until done. Created by Geoffrey Huntley, now used by Claude Code and others.
image: /img/blog/ralph-wiggum-technique.png
---

The Ralph Wiggum technique is running AI coding agents in autonomous loops until the task is done. You give it a job, walk away, come back to a PR. That is the whole idea.

<!-- truncate -->

The technique was created by [Geoffrey Huntley](https://ghuntley.com/), an open source developer in Australia who started experimenting with autonomous AI coding loops in mid-2025. His [original implementation](https://github.com/ghuntley/how-to-ralph-wiggum) was almost disappointingly simple: a bash while loop that feeds the same prompt to Claude over and over until the task is done. It went viral by the end of 2025 and has since been adopted by [Anthropic's Claude Code](https://github.com/anthropics/claude-code/blob/main/plugins/ralph-wiggum/README.md), [Vercel's AI SDK](https://github.com/vercel-labs/ralph-loop-agent), and others.

People always ask about the name. Yes, it is the Simpsons character. Ralph approaches everything with pure, unfiltered confidence and persistence. *"I'm learnding!"* He just... keeps going. And that is exactly what you want the AI to do.

Instead of treating the AI as a chat partner you go back and forth with, copy error, paste into chat, get fix, paste back, run tests, repeat, you treat it as a worker that iterates until done. You step out of the loop entirely.

Traditional AI coding (the clipboard dance):

```
You: "build this feature"
AI: generates code
You: *runs tests* "tests fail, here's the error"
AI: generates fix
You: *runs lint* "linter is angry about unused imports"
AI: another fix
You: *runs tests again* "ok now commit it"
```

That is 4 round trips. Each one takes you 30 seconds to a minute because you have to context switch, copy output, paste it, wait for a response. It adds up fast.

Ralph Wiggum technique:

```
You: "build this feature, run tests, fix errors, commit when done"
AI: loops autonomously until everything passes
You: *reviews PR*
```

One input. One output. Everything in between is handled.

The difference is not just convenience. The AI can iterate *fast* without waiting on a human to relay errors. It reads the error output directly, understands what went wrong, fixes it, re-runs validation. All in seconds. No clipboard involved.

Here is what it looks like in practice with ralph-starter:

```bash
$ ralph-starter run "add user registration with email/password" --loops 5 --test --lint --build --commit

🔄 Loop 1/5
  → Writing code with Claude Code...
  → Created: src/auth/register.ts, src/auth/__tests__/register.test.ts
  → Running tests... 3 passed, 2 failed
  → Test failure: bcrypt not imported

🔄 Loop 2/5
  → Fixing: adding bcrypt import and hash logic...
  → Running tests... 5 passed ✓
  → Running lint... 1 issue (unused variable)

🔄 Loop 3/5
  → Fixing lint: removing unused `salt` variable...
  → Running lint... clean ✓
  → Running build... success ✓
  → Committing changes...

✅ Done in 1m 44s | Cost: $0.34 | Tokens: 26,190
```

Three loops, under 2 minutes, 34 cents. The agent saw the bcrypt error, fixed it, saw the lint warning, fixed that too -- I did not touch anything.

The loop executor runs the coding agent, checks the result against your test suite, lint, and build. If anything fails, the failure becomes context for the next loop. The agent sees the exact error message and fixes it. Just like Ralph Wiggum -- *"I bent my Wookiee"* -- it acknowledges the problem and keeps going.

Three things prevent it from going off the rails:

**Circuit breaker** trips after 3 consecutive identical failures or 5 of the same error, so it does not keep burning tokens on something that is stuck. I have seen this save me money when a task genuinely needed a different approach.

**Completion detector** verifies that files actually changed before accepting "I'm done" from the agent. Without this, the AI occasionally claims it finished without actually writing anything -- learned that one the hard way.

**Cost tracker** runs in real time so you see what you are spending per iteration. Transparency matters when you are [running lots of loops](/blog/prompt-caching-saved-me-47-dollars).

## What works and what does not

Best tasks for the Ralph Wiggum technique: well-defined inputs and outputs. Add an endpoint, fix a bug that has a failing test, implement a component from a [design spec](/blog/figma-to-code-one-command). Things where "done" is clear.

Worst tasks: vague ones like "make the code better" or "improve performance." The AI has no target to iterate toward. I learned this the hard way when I tried to [batch process 10 issues](/blog/automating-entire-workflows) and the vague ones hit the circuit breaker every time.

Good specs, good tests, let the ralph loop handle the rest. That is the technique in one sentence.

Want to try the Ralph Wiggum technique on your own project?

```bash
npx ralph-starter init
ralph-starter run "your task here" --loops 3 --test --lint --commit
```

*"Hi, Super Nintendo Chalmers!"* -- just let Ralph do his thing.

## References

- [Why I built ralph-starter](/blog/why-i-built-ralph-starter)
- [My first ralph loop](/blog/my-first-ralph-loop)
- [Specs are the new code](/blog/specs-are-the-new-code)
- [Figma to code in one command](/blog/figma-to-code-one-command)
- [Getting started docs](/docs/intro)
- [Loop executor docs](/docs/cli/run)
- [FAQ about the technique](/docs/faq)
