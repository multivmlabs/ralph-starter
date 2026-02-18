---
slug: ralph-starter-with-linear
title: How I use ralph-starter with Linear every day
authors: [ruben]
tags: [ralph-starter, linear, workflow, daily-use]
image: /img/blog/linear-workflow.png
---

Linear is where my team plans work. ralph-starter is where it gets built. At this post I will show you my daily workflow.

<!-- truncate -->

Every morning I open Linear and check the sprint. Tickets that are well-specified I process with ralph-starter. Tickets that need thinking or architecture decisions I handle myself.

Setup is quick:

```bash
ralph-starter config set linear.apiKey lin_api_xxxxx
```

For a single ticket:

```bash
ralph-starter run --from linear --project ENG --issue ENG-42 --commit --pr
```

![ralph-starter processing a Linear ticket](/img/blog/linear-workflow.png)

Hits the Linear GraphQL API, pulls title, description, priority, labels, sub-issues. All becomes context for the coding agent.

For batch I filter by label. We use "ralph-ready" for tickets that are groomed:

```bash
ralph-starter auto --source linear --project ENG --label "ralph-ready" --limit 5
```

What Linear gives you that makes a difference is structured data. Every ticket has priority (urgent, high, medium, low), status, labels. ralph-starter uses priority for task ordering and includes metadata in agent context.

```
Fetched 5 issues from Linear:

Urgent:
  ENG-89: Fix auth token expiry handling

High:
  ENG-91: Add retry logic to webhook delivery
  ENG-93: Rate limit the public API

Medium:
  ENG-95: Add dark mode to settings
```

My typical day: morning standup, I see 3 or 4 tickets. Label the straightforward ones "ralph-ready" and kick off auto mode. While that runs I work on the complex ticket. By the time I finish the hard work, ralph-starter has PRs waiting for review.

One thing that works well is writing acceptance criteria as checklist in Linear:

```
Acceptance:
[ ] Endpoint returns JSON response
[ ] Tests cover happy path and error case
[ ] No lint warnings
[ ] Build succeeds
```

ralph-starter extracts checkboxes from the ticket body and uses as completion criteria. Agent knows it needs to satisfy each point before signaling done.

The tickets that work best are the ones with clear inputs and outputs. "Add this endpoint", "Fix this test", "Update this component". Tickets that need a human are where the approach is not obvious yet.

## References

- [Linear integration docs](/docs/sources/linear)
- [Auto mode](/docs/cli/auto)
