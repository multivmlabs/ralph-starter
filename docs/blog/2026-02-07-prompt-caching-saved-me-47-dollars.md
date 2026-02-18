---
slug: prompt-caching-saved-me-47-dollars
title: Prompt caching saved me $47 last month
authors: [ruben]
tags: [ralph-starter, cost, prompt-caching, optimization]
image: /img/blog/cost-tracking.png
---

I run ralph-starter a lot. Like, multiple tasks per day, 3 to 7 loops each. Last month I checked my Anthropic dashboard and total API spend was $62. Without prompt caching it would have been $109. That is $47 I did not pay. For doing nothing extra.

<!-- truncate -->

You know what happened? I almost did not notice. The savings just... happened in the background. But when I looked at the numbers, I realized prompt caching is the single biggest reason ralph-starter loops are affordable for daily use.

Let me explain how it works in practice.

When ralph-starter runs Claude Code in a loop, the first iteration sends the full context: system prompt, your project files, the spec, the implementation plan. Expensive, because all of those are fresh tokens. But Claude's prompt caching stores that context server-side. On loop 2, 3, 4 -- those cached tokens cost 90% less.

```
Regular input:  $3.00 per million tokens
Cache write:    $3.75 per million (first time, slight premium)
Cache read:     $0.30 per million (90% off!)
Output:         $15.00 per million tokens
```

In a 5-loop task, about 80% of input tokens are the same across every iteration. System prompt, spec, project context -- none of that changes. Only the validation feedback (test errors, lint output) is new. So after loop 1, you pay $0.30/M instead of $3.00/M on the bulk of your input. That is a 10x difference on most of your tokens.

![Cost summary showing cache savings](/img/blog/cost-tracking.png)

ralph-starter tracks this automatically. After every run you see exactly what you spent:

```bash
$ ralph-starter run "add pagination to /api/users" --loops 5 --test --commit

🔄 Loop 1/5
  → Writing code with Claude Code...
  → Running tests... 4 passed, 1 failed

🔄 Loop 2/5
  → Fixing: off-by-one in page calculation...
  → Running tests... 5 passed ✓
  → Committing changes...

✅ Done in 1m 48s | Cost: $0.31 | Tokens: 28,412

Cost Breakdown:
  Loop 1: $0.22 (cache write)
  Loop 2: $0.09 (cache read — 90% savings on 22K input tokens)
  Cache savings: $0.18
```

31 cents for a feature with pagination, tests, and a commit. I used to spend that on a ChatGPT message and still have to copy-paste the code myself.

## What affects your costs

More loops means more cache hits. A 1-loop task barely benefits -- the context gets cached but never reused. A 5-loop task benefits a lot because loops 2 through 5 all reuse that cached context. This is why the [ralph loop design](/blog/my-first-ralph-loop) is so important: iteration is cheap once you have paid for the first pass.

Bigger specs mean more tokens to cache, so bigger absolute savings on subsequent loops. A detailed spec with acceptance criteria might cost more on loop 1, but the savings compound on every loop after.

The Batch API is a separate thing entirely. `ralph-starter auto --batch` uses the Anthropic Batch API at a flat 50% discount on all tokens. Takes up to 24 hours and no tool use, but worth it for straightforward tasks where you do not need results immediately. I mentioned this in the [batch processing post](/blog/ten-github-issues-went-to-lunch).

## What actually helped me cut costs

I started paying attention after my first week came in at $35. The cost tracker showed most of my spend was on tasks where I set too many loops. A task that completes in 2 loops does not need `--loops 10`. I was being lazy with the flag and it cost me.

Now I follow a simple rule: `--loops 3` for simple tasks, `--loops 5` for complex ones. I almost never go higher.

But here is the real insight, and I keep coming back to this: the best cost optimization is not a caching trick. It is writing [better specs](/blog/specs-are-the-new-code). A clear spec means the agent gets it right in fewer loops. Fewer loops means fewer API calls. A spec that executes in 2 iterations instead of 7 saves you more than any caching ever could.

As Ralph Wiggum once said, *"I'm Idaho!"* -- and no, that does not apply here at all, but it makes me smile every time I see my cost tracker show $0.00 on a cache hit.

Want to see your own cost breakdown?

```bash
npx ralph-starter init
```

Every run shows token usage and cost automatically. No extra config needed.

## References

- [My first ralph loop](/blog/my-first-ralph-loop)
- [Specs are the new code](/blog/specs-are-the-new-code)
- [10 GitHub issues and went to lunch](/blog/ten-github-issues-went-to-lunch)
- [ralph-starter + Claude Code setup](/blog/ralph-starter-claude-code-setup)
- [Cost tracking guide](/docs/guides/cost-tracking)
- [Prompt caching docs](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
