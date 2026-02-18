---
slug: specs-are-the-new-code
title: Specs are the new code
authors: [ruben]
tags: [ralph-starter, specs, workflow, philosophy]
image: /img/blog/specs-new-code.png
---

I spend more time writing specs than writing code now. And my output went up, not down. That surprised me.

<!-- truncate -->

When I started using ralph-starter I wrote quick one-liners as tasks. "Add user auth." "Fix the sidebar." You know what happened? Results were terrible. The AI generated something that looked plausible but completely missed the intent. I would look at the PR and think, "that is not what I meant at all."

I was blaming the tool. But the problem was me.

Then I started writing real specs. Not long documents -- nobody has time for that. Just clear, specific descriptions.

Bad spec:

```
Add authentication to the app
```

Better spec:

```
Add JWT authentication to the Express API.

1. POST /api/auth/login accepts { email, password }
2. Validates against the users table
3. Returns { token, expiresIn } on success
4. Returns 401 with { error } on failure
5. Token expires in 24 hours

Protected routes check Authorization: Bearer <token> header.
Add middleware at src/middleware/auth.ts.
Add tests for login success, login failure, and protected route access.
```

![Good spec vs bad spec comparison](/img/blog/specs-new-code.png)

Second spec is not long. Maybe 10 lines. But it tells the agent exactly what to build, where to put it, and how to verify it. ralph-starter turns that into an implementation plan and the agent executes in 2 to 3 loops.

The difference in output is night and day:

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

Same feature, same agent. The difference? 67 cents and 2 minutes saved. Better spec means fewer loops. Fewer loops means [less cost](/blog/prompt-caching-saved-me-47-dollars). Better output too.

This is why integration with GitHub, [Linear](/blog/ralph-starter-with-linear), Notion matters. Your team is already writing specs there. ralph-starter pulls them directly -- no copy-paste.

```bash
ralph-starter run --from github --project myorg/myrepo --issue 42 --commit --pr
```

Quality of the PR is directly proportional to quality of the issue. I have seen this enough times now that I treat it as a law.

I changed how I write issues. Every ticket now has a clear description of what needs to happen. Not "improve the thing" but "response time of /api/users should be under 200ms." Acceptance criteria as a checklist. Technical context when relevant, like "we use Prisma" or "follow the pattern in `src/api/orders.ts`."

The workflow flipped. Before AI coding I would spend 10% of my time planning and 90% implementing. Now I spend 40% writing specs and 60% reviewing output. Total time is less, quality is higher, and the specs serve as documentation for what was built. Win-win-win.

If you use ralph-starter and the output is not good enough, the fix is almost always in the spec. Not in the tool, not in the agent, not in the model. The spec. As Ralph Wiggum would say, *"The doctor said I wouldn't have so many nosebleeds if I kept my finger outta there"* -- sometimes the answer is obvious, we just do not want to hear it.

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
