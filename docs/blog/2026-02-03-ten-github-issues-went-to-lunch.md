---
slug: ten-github-issues-went-to-lunch
title: I gave ralph-starter 10 GitHub issues and went to lunch
authors: [ruben]
tags: [ralph-starter, auto-mode, github, batch-processing]
image: /img/blog/auto-mode-github.png
---

I labeled 10 GitHub issues as "auto-ready" on Monday morning, ran one command, and went to get lunch. A real lunch, not the sad desk sandwich. Came back 45 minutes later to 8 open PRs waiting for review.

<!-- truncate -->

You know what my Monday mornings used to look like? Sprint planning, then sitting down to grind through a backlog of "small" tickets that somehow ate the whole day. Not anymore.

```bash
$ ralph-starter auto --source github --project multivmlabs/ralph-starter --label "auto-ready" --limit 10

  Found 10 issues with label "auto-ready"
  Starting batch processing...
```

Auto mode is the batch processor. It pulls issues from GitHub (or [Linear](/blog/ralph-starter-with-linear)), processes each one: creates branch, runs the agent in loops, validates, commits, pushes, opens PR. Each issue gets its own branch `auto/<issue-id>`.

![Auto mode processing multiple GitHub issues](/img/blog/auto-mode-github.png)

Of the 10 issues, 8 completed and produced clean PRs. One hit the circuit breaker because the description was too vague ("improve performance" with no specifics -- you know the type). Another completed code but failed the build because it needed a dependency I had not installed locally. That one was on me.

That is the thing about auto mode. It works best when issues have clear specs. "Add a /health endpoint that returns 200 with `{ status: 'ok' }`" -- that works great. "Make the app better" -- yeah, no. As Ralph Wiggum would say, *"That's unpossible!"*

Here is what the actual output looked like:

```bash
$ ralph-starter auto --source github --project multivmlabs/ralph-starter --label "auto-ready" --limit 10

[1/10] Issue #145: Add health check endpoint
  → Branch: auto/145
  → 2 loops → Validation: passed ✓
  → PR #151 created

[2/10] Issue #147: Add rate limit headers to API responses
  → Branch: auto/147
  → 1 loop → Validation: passed ✓
  → PR #152 created

[3/10] Issue #148: Fix timezone bug in date formatter
  → Branch: auto/148
  → 3 loops → Validation: passed ✓
  → PR #153 created

[4/10] Issue #150: Improve performance
  → 3 loops → Circuit breaker tripped. Skipping.
  → Reason: no clear acceptance criteria

...

[10/10] Issue #162: Add CSV export to reports page
  → Branch: auto/162
  → 4 loops → Validation: passed ✓
  → PR #159 created

✅ Completed: 8/10 | Failed: 2/10
   Total cost: $2.14 | Total time: 18m 42s
```

Eight PRs for $2.14. I spent more on that lunch.

Each PR gets a body with what was implemented, files changed, and validation results. I reviewed them like any other PRs from my team. Approved 6, requested changes on 2 (one needed a slightly different error message, the other missed an edge case in the spec).

## Tips for getting the most out of auto mode

Write issues with acceptance criteria. Even a simple checklist helps the agent understand when it is done. I talked about this more in [specs are the new code](/blog/specs-are-the-new-code).

Use `--dry-run` first to preview which issues will be processed:

```bash
$ ralph-starter auto --source github --project myorg/myrepo --label "auto-ready" --dry-run

  Found 5 issues:
    #201: Add pagination to /api/users (labels: auto-ready, backend)
    #203: Fix mobile nav z-index (labels: auto-ready, frontend, bug)
    #205: Add email validation to signup form (labels: auto-ready, frontend)
    #207: Update error messages to be user-friendly (labels: auto-ready)
    #209: Add retry logic to webhook sender (labels: auto-ready, backend)

  Dry run complete. No changes made.
```

If you are worried about cost, the `--batch` flag uses the Anthropic Batch API at 50% off. Slower (up to 24 hours) and no tool use, but worth it for straightforward tasks where you do not need results immediately.

I now label issues "auto-ready" during grooming. If an issue has a clear spec and acceptance criteria, it gets the label. Once or twice a week I run auto mode and come back to a stack of PRs. It changed how I think about my week.

Ready to try batch processing?

```bash
npm i -g ralph-starter
ralph-starter init
ralph-starter auto --source github --project your-org/your-repo --label "auto-ready" --limit 5
```

## References

- [Why I built ralph-starter](/blog/why-i-built-ralph-starter)
- [Specs are the new code](/blog/specs-are-the-new-code)
- [ralph-starter with Linear](/blog/ralph-starter-with-linear)
- [Prompt caching saved me $47](/blog/prompt-caching-saved-me-47-dollars)
- [Auto mode docs](/docs/cli/auto)
- [GitHub integration](/docs/sources/github)
