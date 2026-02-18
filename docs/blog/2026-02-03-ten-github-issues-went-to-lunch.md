---
slug: ten-github-issues-went-to-lunch
title: I gave ralph-starter 10 GitHub issues and went to lunch
authors: [ruben]
tags: [ralph-starter, auto-mode, github, batch-processing]
image: /img/blog/auto-mode-github.png
---

I labeled 10 GitHub issues as "auto-ready" on Monday morning, ran one command, went to lunch. Came back to 8 open PRs.

<!-- truncate -->

```bash
ralph-starter auto --source github --project multivmlabs/ralph-starter --label "auto-ready" --limit 10
```

Auto mode is the batch processor. Pulls issues from GitHub (or Linear), processes each one: creates branch, runs agent, validates, commits, pushes, opens PR. Each issue gets its own branch `auto/<issue-id>`.

![Auto mode processing multiple GitHub issues](/img/blog/auto-mode-github.png)

Of the 10 issues, 8 completed and produced clean PRs. One hit the circuit breaker because the description was too vague ("improve performance" with no details). Another completed code but failed build because it needed a dependency I had not installed.

That's the thing. Auto mode works best when issues have clear specs. "Add a /health endpoint that returns 200 with `{ status: 'ok' }`" works great. "Make the app better" does not.

```
[1/10] Issue #145: Add health check endpoint
  → Branch: auto/145
  → 2 loops → Validation: passed
  → PR #151 created

[2/10] Issue #147: Add rate limit headers
  → Branch: auto/147
  → 1 loop → Validation: passed
  → PR #152 created

[3/10] Issue #150: Improve performance
  → 3 loops → Circuit breaker tripped. Skipping.
```

Each PR gets a body with what was implemented, files changed, validation results. I reviewed them like any other PRs. Approved 6, requested changes on 2.

## Tips

Write issues with acceptance criteria. Even a simple checklist helps agent understand when it is done.

Use `--dry-run` first to preview which issues will be processed:

```bash
ralph-starter auto --source github --project myorg/myrepo --label "auto-ready" --dry-run
```

If worried about cost, the `--batch` flag uses Anthropic Batch API at 50% off. Slower (up to 24 hours) and no tool use, but worth it for straightforward tasks.

I now label issues "auto-ready" during grooming. If issue has clear spec and acceptance criteria, it gets the label. Once or twice a week I run auto mode and come back to a stack of PRs.

## References

- [Auto mode docs](/docs/cli/auto)
- [GitHub integration](/docs/sources/github)
