---
slug: prompt-caching-saved-me-47-dollars
title: Prompt caching saved me $47 last month
authors: [ruben]
tags: [ralph-starter, cost, prompt-caching, optimization]
description: Prompt caching gives 90% off input tokens after the first loop. My bill dropped from $109 to $62 last month without changing anything.
image: /img/blog/cost-tracking.png
---

I run ralph-starter a lot. Multiple tasks per day, 3 to 7 loops each. Last month I checked my Anthropic dashboard and the total was $62, almost scrolled past it, but then I looked at the prompt caching line and did the math. Without caching? $109. I saved $47 by literally doing nothing.

<!-- truncate -->

Ok so let me explain why this blew my mind.

Every time ralph-starter runs Claude Code in a loop, that first iteration ships everything over: system prompt, project files, the spec, the implementation plan. All fresh tokens, expensive. But Claude's prompt caching stores all of that server-side, so on loop 2, 3, 4 those same tokens cost 90% less. You basically get a discount for repeating yourself.

```
Regular input:  $3.00 per million tokens
Cache write:    $3.75 per million (first time, slight premium)
Cache read:     $0.30 per million (90% off)
Output:         $15.00 per million tokens
```

Think about a 5-loop task. Something like 80% of the input tokens are identical every single iteration. The system prompt, the spec, your project context -- none of that changes between loops. The only new stuff is validation feedback, like test errors or lint output. So after loop 1, you are paying $0.30/M instead of $3.00/M on most of your input. Ten times cheaper, for free.

ralph-starter tracks all of this automatically. After every run you see exactly what you spent, no extra setup:

```bash
$ ralph-starter run "add pagination to /api/users" --loops 5 --test --commit

Loop 1/5
  Writing code with Claude Code...
  Running tests... 4 passed, 1 failed

Loop 2/5
  Fixing: off-by-one in page calculation...
  Running tests... 5 passed
  Committing changes...

Done in 1m 48s | Cost: $0.31 | Tokens: 28,412

Cost Breakdown:
  Loop 1: $0.22 (cache write)
  Loop 2: $0.09 (cache read, 90% savings on 22K input tokens)
  Cache savings: $0.18
```

31 cents for pagination, tests, and a commit. I used to spend more than that on a single ChatGPT message and still have to copy-paste the code myself.

## What affects your costs

More loops = more cache hits. Simple math. A 1-loop task barely benefits because the context gets cached but never reused. A 5-loop task though? Loops 2 through 5 all ride on that cached context. This is why the [ralph loop design](/blog/my-first-ralph-loop) matters -- iteration is basically free once you have paid for the first pass.

Bigger specs also mean more tokens getting cached, so the absolute savings on subsequent loops go up. A detailed spec with acceptance criteria costs more on loop 1, sure, but the savings compound after that.

Oh and the Batch API is a completely different beast. `ralph-starter auto --batch` uses the Anthropic Batch API at a flat 50% discount on all tokens. Catch is it takes up to 24 hours and no tool use, but for straightforward tasks where you do not need results right now? Worth it. I wrote about that in the [batch processing post](/blog/automating-entire-workflows).

## What actually helped me cut costs

My first week came in at $35 and I panicked a little. Looked at the cost tracker and immediately saw the problem: I was setting `--loops 10` on everything. A task that completes in 2 loops does not need 10. I was being lazy with the flag and paying for it.

Now I keep it simple: `--loops 3` for easy stuff, `--loops 5` for complex things. I almost never go higher.

But the biggest cost optimization is not a caching trick -- it is writing [better specs](/blog/specs-are-the-new-code). A clear spec means the agent gets it right in fewer loops, which means fewer API calls. A spec that lands in 2 iterations instead of 7 saves you way more than any caching ever could.

Want to see your own cost breakdown?

```bash
npx ralph-starter init
```

Every run shows token usage and cost automatically. No extra config needed.

## References

- [My first ralph loop](/blog/my-first-ralph-loop)
- [Specs are the new code](/blog/specs-are-the-new-code)
- [Automating entire workflows](/blog/automating-entire-workflows)
- [ralph-starter + Claude Code setup](/blog/ralph-starter-claude-code-setup)
- [Cost tracking guide](/docs/guides/cost-tracking)
- [Prompt caching docs](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
