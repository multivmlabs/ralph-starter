---
slug: ralph-starter-vs-manual
title: ralph-starter vs doing it manually
authors: [ruben]
tags: [ralph-starter, comparison, productivity, workflow]
description: I tracked one full sprint week. 6 tasks manual, 6 with ralph-starter. 45 min vs 12 min per task. $1.87 total for the automated half.
image: /img/ralph/6.jpg
---

I tracked one full week of development. Half the tasks with ralph-starter, half by hand. Same sprint, same project, same me, same coffee intake (a lot).

<!-- truncate -->

Look, I have been telling people ralph-starter saves time for weeks, but I realized I had never actually measured it. I was just vibing on the feeling that things were faster. That is not great. So I ran an honest experiment on myself.

12 features from the sprint backlog. All had clear specs in [Linear](/blog/ralph-starter-with-linear). Endpoints, bug fixes, component updates, tests. Nothing exotic -- the kind of stuff that fills up every sprint everywhere.

I split them down the middle. 6 done manually (IDE open, ChatGPT tab, write code, run tests, fix, commit, repeat). 6 with ralph-starter.

## Manual: the way I have been doing it for years

Read the ticket. Think about approach. Open files. Start coding. Hit a snag, open ChatGPT, paste context, get a suggestion back, realize it is not quite right, spend 10 minutes adapting it. Run tests. Something fails. Fix it. Run lint. Fix that too. Commit. Push. Open PR. You know this loop. You have lived this loop.

Average: **45 minutes per task** for a total of about 4.5 hours of focused work.

And honestly, "focused" is generous. A chunk of that time was me being a human clipboard between ChatGPT and my editor. The AI was helpful but I was the integration layer. I was the glue code.

## ralph-starter: the other way

Read ticket. Label it "ralph-ready". Run one command. Go do something else. Review the PR when it shows up.

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

Average: **12 minutes per task** -- and most of that was waiting while I worked on other stuff. The actual hands-on time for all 6 was about 1.2 hours. Reading the PR, checking the diff, approving or leaving a comment. That is it.

## Quality

Ok here is the part where I have to be honest. Both approaches produced working code. Tests passed, lint passed. The ralph-starter PRs were more verbose in places -- the AI writes more error handling and more comments than I would. Way more. I would have skipped half those try/catch blocks. Is that better practice? Probably. Am I lazy sometimes? Absolutely.

Nothing needed major rework either way. The AI code was not worse. It was just... more cautious than I am.

## Where ralph-starter won

**Consistency.** Every. Single. PR. Had tests. Passed lint. Passed build. When I code manually I sometimes skip writing tests for small changes. "It is just a tiny fix, I will add tests later." (I never add tests later.) The validation loop does not let the AI get away with that. I talked about this in the [Ralph Wiggum technique](/blog/ralph-wiggum-technique) post -- the loop enforces discipline that I personally do not have.

**Throughput.** 6 features in the time I would normally do 2, maybe 3. That is not 2x. That is closer to 3.5x once you factor in all the context switching overhead from doing things manually.

**Cost.** The 6 ralph-starter tasks cost $1.87 total in API spend, six tasks for less than two dollars. I [track costs carefully](/blog/prompt-caching-saved-me-47-dollars) now and this is pretty normal.

## Where I won

**Complex design decisions.** One task needed choosing between two data modeling approaches. The AI would have just picked one and run with it. I needed to think through tradeoffs, talk to the team, consider what happens next quarter. Ralph Wiggum vibes do not work here -- *"I choo-choo-choose you!"* is not a valid data modeling strategy.

**Knowing stuff the AI does not.** On a refactoring task, I knew a certain pattern was going to be deprecated next sprint. The AI had no idea. It would have happily written more of the old pattern and felt great about it. Sometimes you need the person who was in last week's meeting.

## What I took away from this

ralph-starter is better than me at "turn this spec into code." Faster, more consistent, less lazy about error handling. I am better than the AI at "figure out what we should build."

So now I focus on three things: writing [clear specs](/blog/specs-are-the-new-code) (AI input), reviewing PRs (AI output), and architecture decisions (AI blind spot). The mechanical part in between -- translating spec to code -- ralph-starter does that. And it does not get distracted by Slack.

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
