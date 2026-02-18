---
slug: ralph-starter-vs-manual
title: ralph-starter vs doing it manually
authors: [ruben]
tags: [ralph-starter, comparison, productivity, workflow]
image: /img/blog/vs-manual.png
---

I tracked one full week of development. Half the tasks with ralph-starter, half the traditional way. No cherry-picking, no unfair comparisons. Same sprint, same project, same me. Here is what the numbers actually looked like.

<!-- truncate -->

I have been claiming ralph-starter saves time for weeks now. But I realized I never actually measured it side by side. So I decided to run an honest experiment on myself.

12 features from the sprint backlog. All had clear specs in [Linear](/blog/ralph-starter-with-linear). A mix of endpoints, bug fixes, component updates, tests. Nothing exotic -- the kind of stuff that fills up a typical sprint.

I split them down the middle. 6 manual (IDE, ChatGPT, write code, run tests, fix, commit). 6 with ralph-starter.

![Comparison: manual vs ralph-starter](/img/blog/vs-manual.png)

## Manual workflow

Read ticket. Think about approach. Open files. Start coding. Hit a snag, open ChatGPT, paste context, get suggestion, adapt it. Run tests, fix. Run lint, fix. Commit. Push. Open PR. You know the drill -- you have done this a thousand times.

Average: **45 minutes per task**. Total for 6: about 4.5 hours of focused work.

And honestly? Some of those 45 minutes included me staring at a ChatGPT response thinking "that is not quite right" and spending 10 minutes adapting it. The AI was helpful, but I was still the integration layer.

## ralph-starter workflow

Read ticket. Label "ralph-ready". Run one command. Go work on something else. Review PR when notification comes in.

```bash
$ ralph-starter run --from linear --project ENG --issue ENG-71 --commit --pr --loops 5 --test --lint

🔄 Loop 1/5
  → Fetching spec from Linear: ENG-71
  → "Add email validation to signup form"
  → Writing code with Claude Code...
  → Running tests... 4 passed, 1 failed

🔄 Loop 2/5
  → Fixing: regex pattern for edge case emails...
  → Running tests... 5 passed ✓
  → Running lint... clean ✓
  → Committing changes...
  → Opening PR #112...

✅ Done in 1m 38s | Cost: $0.23 | Tokens: 17,640
```

Average: **12 minutes per task** (mostly waiting while doing other things). Total for 6: about 1.2 hours of active attention. That is reading the PR, checking the diff, hitting approve or leaving a comment.

Let me say that again. 1.2 hours vs 4.5 hours. For the same output.

## Quality

Both approaches produced working code that passed tests and lint. ralph-starter PRs had slightly more verbose code in some cases -- the AI adds more error handling and comments than I would. But nothing that needed major rework. If anything, the extra error handling was arguably better practice. I am just lazy sometimes.

## Where ralph-starter won

**Consistency.** Every single PR had tests, passed lint, passed build. When I code manually I sometimes skip tests for small changes. The validation loop does not let the AI skip. This is something I talked about in the [Ralph Wiggum technique](/blog/ralph-wiggum-technique) post -- the loop enforces discipline that I do not always have.

**Throughput.** 6 features in the time I would normally handle 2, maybe 3. That is not 2x -- that is closer to 3.5x once you factor in context switching overhead.

**Cost.** The 6 ralph-starter tasks totaled $1.87 in API costs. Six tasks. Less than two dollars. I [track costs carefully](/blog/prompt-caching-saved-me-47-dollars) now and this is typical.

## Where manual won

**Complex design decisions.** One task needed choosing between two data modeling approaches. The AI would have picked one and run with it. I needed to think through tradeoffs, talk to the team, consider future implications. Ralph Wiggum vibes do not work here -- *"I choo-choo-choose you!"* is not a valid data modeling strategy.

**Existing context.** On a refactoring task, I knew a certain pattern was going to be deprecated next sprint. The AI did not know that. It would have happily implemented more of the old pattern. Sometimes you need the human who was in last week's meeting.

## My conclusion

ralph-starter handles "implementation from spec" better than I do. Faster and more consistent. I handle "figure out what to build" better than the AI. The ideal workflow uses both.

Now I spend my energy on three things: writing [clear specs](/blog/specs-are-the-new-code) (AI input), reviewing PRs (AI output), and architecture decisions (AI blind spot). Everything in between -- the mechanical translation of spec to code -- ralph-starter handles that.

Want to run your own comparison?

```bash
npm i -g ralph-starter
ralph-starter init
ralph-starter run --from github --issue YOUR_ISSUE --commit --pr --loops 3 --test --lint
```

Pick a task you would normally do by hand. Time yourself both ways. I think you will be surprised.

## References

- [Why I built ralph-starter](/blog/why-i-built-ralph-starter)
- [Specs are the new code](/blog/specs-are-the-new-code)
- [The Ralph Wiggum technique](/blog/ralph-wiggum-technique)
- [ralph-starter with Linear](/blog/ralph-starter-with-linear)
- [Prompt caching saved me $47](/blog/prompt-caching-saved-me-47-dollars)
- [Getting started docs](/docs/intro)
- [Auto mode docs](/docs/cli/auto)
