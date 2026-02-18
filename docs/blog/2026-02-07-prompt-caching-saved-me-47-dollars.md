---
slug: prompt-caching-saved-me-47-dollars
title: Prompt caching saved me $47 last month
authors: [ruben]
tags: [ralph-starter, cost, prompt-caching, optimization]
image: /img/blog/cost-tracking.png
---

I run ralph-starter a lot. Multiple tasks per day, 3 to 7 loops each. Last month total API spend was $62. Without prompt caching it would have been $109.

<!-- truncate -->

When ralph-starter runs Claude Code in a loop, first iteration sends the full context: system prompt, project files, spec, implementation plan. Expensive because all fresh tokens. But Claude's prompt caching stores that context server-side. On loop 2, 3, 4 those cached tokens cost 90% less.

```
Regular input:  $3.00 per million tokens
Cache write:    $3.75 per million (first time)
Cache read:     $0.30 per million (90% off)
Output:         $15.00 per million tokens
```

In a 5-loop task, about 80% of input tokens are the same across iterations. System prompt, spec, project context. Only validation feedback changes. So after loop 1 you pay $0.30/M instead of $3.00/M on the bulk of input.

![Cost summary showing cache savings](/img/blog/cost-tracking.png)

ralph-starter tracks this automatically:

```
Cost Summary:
  Tokens: 125K (85K in / 40K out)
  Cost: $1.23
  Cache savings: $0.45
  Avg per iteration: $0.25
```

## What affects your costs

More loops means more cache hits. A 1-loop task barely benefits. A 5-loop task benefits a lot because loops 2 through 5 reuse cached context.

Bigger specs mean more tokens to cache, so bigger savings on subsequent loops.

The Batch API is separate. `ralph-starter auto --batch` uses Anthropic Batch API at flat 50% discount on all tokens. Takes up to 24 hours and no tool use, but good for code generation tasks.

## What helped me

I started paying attention after first week came in at $35. Cost tracker showed most spend was on tasks where I set too many loops. A task that completes in 2 loops does not need `--loops 10`.

Now I start with `--loops 3` for simple tasks and `--loops 5` for complex ones.

The other thing: writing better specs. Clear spec means agent gets it right in fewer loops. Fewer loops means fewer API calls. Best cost optimization is not a caching trick, it is writing specs that execute in 2 to 3 iterations instead of 7.

## References

- [Cost tracking guide](/docs/guides/cost-tracking)
- [Prompt caching docs](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
