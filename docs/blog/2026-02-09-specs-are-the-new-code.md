---
slug: specs-are-the-new-code
title: Specs are the new code
authors: [ruben]
tags: [ralph-starter, specs, workflow, philosophy]
image: /img/blog/specs-new-code.png
---

I spend more time writing specs than writing code now, and my output went up not down.

<!-- truncate -->

When I started using ralph-starter I wrote quick one-liners. "Add user auth." "Fix the sidebar." Results were bad. AI generated something plausible but missed the intent.

Then I started writing real specs. Not long documents, just clear descriptions.

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

Second spec is not long. 10 lines. But tells the agent exactly what to build, where to put it, how to verify. ralph-starter turns that into an implementation plan and the agent executes in 2 to 3 loops.

This is why integration with GitHub, Linear, Notion matters. Your team is already writing specs there. ralph-starter pulls them directly.

```bash
ralph-starter run --from github --project myorg/myrepo --issue 42 --commit --pr
```

Quality of the PR is directly proportional to quality of the issue.

I changed how I write issues. Every ticket now has clear description of what needs to happen. Not "improve the thing" but "response time of /api/users should be under 200ms". Acceptance criteria as checklist. Technical context when relevant like "we use Prisma" or "follow pattern in `src/api/orders.ts`".

The workflow flipped. Before AI coding you spend 10% planning and 90% implementing. Now I spend 40% writing specs and 60% reviewing output. Total time is less, quality is higher, and specs serve as documentation for what was built.

If you use ralph-starter and output is not good enough, fix is almost always in the spec.

## References

- [PRD workflow guide](/docs/guides/prd-workflow)
- [Sources overview](/docs/sources/overview)
