---
slug: ralph-wiggum-technique
title: Ralph Wiggum technique explained in 2 minutes
authors: [ruben]
tags: [ralph-wiggum, technique, ai-coding, autonomous]
image: /img/blog/ralph-wiggum-technique.png
---

Ralph Wiggum technique is running AI coding agents in autonomous loops until the task is done. You give it a job and let it go.

<!-- truncate -->

The name is from the Simpsons character. Ralph approaches everything with confidence and persistence. That is the idea. Instead of treating the AI as a chat partner you go back and forth with, you treat it as a worker that iterates until done.

Traditional AI coding:

```
You: "build this feature"
AI: generates code
You: "tests fail"
AI: generates fix
You: "linter is angry"
AI: another fix
You: "ok commit it"
```

Ralph Wiggum technique:

```
You: "build this feature, run tests, fix errors, commit when done"
AI: loops autonomously until everything passes
```

![Ralph Wiggum loop diagram](/img/blog/ralph-wiggum-technique.png)

The difference is not just convenience. AI can iterate fast without waiting on a human to relay errors. It reads error output, understands what went wrong, fixes, re-runs validation. All in seconds.

ralph-starter implements this with a loop executor:

```bash
ralph-starter run "add user registration" --loops 5 --test --lint --build --commit
```

Executor runs the coding agent, checks result against test suite, lint, build. If anything fails, failure becomes context for next loop. Agent sees exact error and fixes.

Three things prevent it from going off the rails:

**Circuit breaker** trips after 3 consecutive failures or 5 identical errors. Does not keep burning tokens.

**Completion detector** verifies files actually changed before accepting "I'm done" from the agent. Prevents false completions.

**Cost tracker** runs real time so you see what you spend per iteration.

Best tasks for this: well-defined inputs and outputs. Add an endpoint, fix a bug with failing test, implement component from design spec. Worst tasks: vague ones like "make code better" because AI has no target to iterate toward.

Good specs, good tests, let the ralph loop handle the rest.

## References

- [Getting started](/docs/intro)
- [Loop executor docs](/docs/cli/run)
- [FAQ about the technique](/docs/faq)
