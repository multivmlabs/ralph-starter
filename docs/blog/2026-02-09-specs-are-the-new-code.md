---
slug: specs-are-the-new-code
title: Specs are the new code
authors: [ruben]
tags: [ralph-starter, specs, workflow, philosophy]
description: A clear 10-line spec gets you a working PR in 2 loops. A vague one-liner wastes 5 loops and costs 3x more. The spec is the code now.
image: /img/ralph/3.jpg
---

I spend more time writing specs than writing code now, and my output went up, not down. That genuinely surprised me.

<!-- truncate -->

When I started using ralph-starter I was writing lazy one-liners. "Add user auth." "Fix the sidebar." Three words and vibes. You can guess what happened. The AI generated something that looked plausible but completely missed what I actually wanted. I would look at the PR and think, "that is not even close to what I meant."

I blamed the tool for like two weeks, but the problem was me.

So I started writing real specs. Not essays -- I do not have time for that. Just clear, specific descriptions of what I actually want.

What I used to write:

```
Add authentication to the app
```

What I write now:

```
Add JWT auth to the Express API.

- POST /api/auth/login takes { email, password }, validates against users table
- Return { token, expiresIn } on success, 401 with { error } on failure
- Token TTL: 24h
- Auth middleware goes in src/middleware/auth.ts (check Authorization: Bearer header)
- Tests: login success, login failure, protected route without token
```

That second spec is maybe 10 lines and took me 3 minutes to write. But it tells the agent exactly what to build, where to put it, and how to verify it works. ralph-starter turns that into an implementation plan and the agent nails it in 2 to 3 loops.

The difference is ridiculous:

```bash
# Bad spec: vague task, agent guesses wrong
$ ralph-starter run "Add authentication to the app" --loops 5 --test --commit

🔄 Loop 1/5 → tests failed (wrong auth strategy)
🔄 Loop 2/5 → tests failed (missing middleware)
🔄 Loop 3/5 → tests failed (wrong token format)
🔄 Loop 4/5 → tests passed ✓ but not what I wanted
✅ Done in 3m 45s | Cost: $0.94 | Tokens: 71,203

# Good spec: clear requirements, agent nails it
$ ralph-starter run --from github --issue 42 --loops 5 --test --commit

🔄 Loop 1/5 → tests: 2 passed, 1 failed (token expiry)
🔄 Loop 2/5 → tests: 3 passed ✓
✅ Done in 1m 12s | Cost: $0.27 | Tokens: 19,844
```

Same feature. Same agent. Same model. The only difference was the spec. 67 cents and 2 minutes I did not need to spend. Better spec, fewer loops, [less cost](/blog/prompt-caching-saved-me-47-dollars), better code. It is almost too simple.

And this is exactly why the GitHub, [Linear](/blog/ralph-starter-with-linear), Notion integrations matter so much. You are probably already writing specs there. ralph-starter just pulls them directly. No copy-paste, no "let me summarize this ticket for the AI."

```bash
ralph-starter run --from github --project myorg/myrepo --issue 42 --commit --pr
```

I have run enough tasks at this point that I am pretty confident about this: the quality of the PR is directly proportional to the quality of the issue. Every single time. I have started treating it as a law of nature.

It completely changed how I write tickets. Every issue now has a clear description of what needs to happen. Not "improve the thing" but "response time of /api/users should be under 200ms." Acceptance criteria as a checklist. Technical context when it matters, like "we use Prisma" or "follow the pattern in `src/api/orders.ts`."

My whole workflow flipped. Before AI coding I spent maybe 10% of my time planning and 90% implementing. Now it is 40% writing specs and 60% reviewing output. Total time is less, quality is higher, and here is the bonus I did not expect: the specs double as documentation for what was built and why.

So if you are using ralph-starter and the output is not good enough, I will save you some debugging time. The fix is almost always in the spec. Not in the tool, not in the agent, not in the model. The spec.

Want to see the difference good specs make?

```bash
npx ralph-starter init
```

Write a detailed issue, point ralph-starter at it, and watch what happens.

## References

- [Why I built ralph-starter](/blog/why-i-built-ralph-starter)
- [ralph-starter with Linear](/blog/ralph-starter-with-linear)
- [Prompt caching saved me $47](/blog/prompt-caching-saved-me-47-dollars)
- [The Ralph Wiggum technique](/blog/ralph-wiggum-technique)
- [PRD workflow guide](/docs/guides/prd-workflow)
- [Sources overview](/docs/sources/overview)
