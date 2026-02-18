---
slug: ralph-starter-vs-manual
title: ralph-starter vs doing it manually
authors: [ruben]
tags: [ralph-starter, comparison, productivity, workflow]
image: /img/blog/vs-manual.png
---

I tracked one week of development. Half tasks with ralph-starter, half the traditional way. Here is what the numbers looked like.

<!-- truncate -->

12 features from the sprint backlog. All had clear specs in Linear. Mix of endpoints, bug fixes, component updates, tests.

I split them. 6 manual (IDE, ChatGPT, write code, run tests, fix, commit). 6 with ralph-starter.

![Comparison: manual vs ralph-starter](/img/blog/vs-manual.png)

## Manual workflow

Read ticket. Think about approach. Open files. Start coding. Hit a snag, open ChatGPT, paste context, get suggestion, adapt. Run tests, fix. Run lint, fix. Commit. Push. Open PR.

Average: **45 minutes per task**. Total for 6: about 4.5 hours.

## ralph-starter workflow

Read ticket. Label "ralph-ready". Run command. Review PR when done.

```bash
ralph-starter run --from linear --project ENG --issue ENG-XX --commit --pr --loops 5 --test --lint
```

Average: **12 minutes per task** (mostly waiting while doing other things). Total for 6: about 1.2 hours active attention.

## Quality

Both produced working code that passed tests and lint. ralph-starter PRs had slightly more verbose code in some cases (AI adds more error handling than I would), but nothing that needed big rework.

## Where ralph-starter won

Consistency. Every PR had tests, passed lint, passed build. When I code manually I sometimes skip tests for small changes. Validation loop does not let AI skip.

Throughput. 6 features in time I normally handle 2 to 3.

## Where manual won

Complex design decisions. One task needed choosing between two data modeling approaches. AI would have picked one and run with it. I needed to think tradeoffs.

Existing context. On a refactoring task I knew a certain pattern was going to be deprecated next sprint. AI did not know that.

## My conclusion

ralph-starter handles "implementation from spec" better than I do. Faster and more consistent. I handle "figure out what to build" better than the AI. Ideal workflow uses both.

Now I spend energy on writing clear specs (AI input), reviewing PRs (AI output), and architecture decisions (AI blind spot). Everything in between ralph-starter handles.

## References

- [Getting started](/docs/intro)
- [Auto mode](/docs/cli/auto)
- [Specs are the new code](/blog/specs-are-the-new-code)
