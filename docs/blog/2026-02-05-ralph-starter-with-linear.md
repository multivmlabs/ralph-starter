---
slug: ralph-starter-with-linear
title: How I use ralph-starter with Linear every day
authors: [ruben]
tags: [ralph-starter, linear, workflow, daily-use]
description: My daily workflow with ralph-starter and Linear. Morning standup, label tickets ralph-ready, batch process while I work on the hard stuff.
image: /img/ralph/3.jpg
---

Linear is where my team plans work. ralph-starter is where it gets built. I have been running this combo every single day for weeks now, and I want to show you exactly what my workflow looks like.

<!-- truncate -->

Every morning I open Linear and check the sprint. Tickets that are well-specified -- clear inputs, clear outputs -- I process with ralph-starter. Tickets that need thinking or architecture decisions? Those I handle myself. The split is usually 60/40 in ralph-starter's favor, which means I spend most of my day on the hard problems.

Setup is quick. One command:

```bash
ralph-starter config set linear.apiKey lin_api_xxxxx
```

For a single ticket:

```bash
$ ralph-starter run --from linear --project ENG --issue ENG-42 --commit --pr

🔄 Loop 1/5
  → Fetching spec from Linear: ENG-42
  → "Add retry logic to webhook delivery"
  → Priority: High | Labels: backend, webhooks
  → Writing code with Claude Code...
  → Running tests... 6 passed, 2 failed

🔄 Loop 2/5
  → Fixing: retry delay calculation off by one...
  → Running tests... 8 passed ✓
  → Committing changes...
  → Opening PR #94...

✅ Done in 1m 51s | Cost: $0.22 | Tokens: 16,830
```

It hits the Linear GraphQL API, pulls the title, description, priority, labels, sub-issues -- everything. All of that becomes context for the coding agent. The agent does not just see "add retry logic." It sees the full ticket with all the context your team wrote.

For batch processing I filter by label. We use "ralph-ready" for tickets that are groomed:

```bash
$ ralph-starter auto --source linear --project ENG --label "ralph-ready" --limit 5

  Fetched 5 issues from Linear (sorted by priority):

  Urgent:
    ENG-89: Fix auth token expiry handling

  High:
    ENG-91: Add retry logic to webhook delivery
    ENG-93: Rate limit the public API

  Medium:
    ENG-95: Add dark mode to settings
    ENG-97: Update user avatar component

  Processing...
```

What Linear gives you that GitHub does not (at least not as cleanly) is structured data. Every ticket has priority (urgent, high, medium, low), status, labels. ralph-starter uses priority for task ordering -- urgent tickets get processed first. Smart, right?

My typical day looks like this: morning standup, I see 3 or 4 tickets assigned to me. I label the straightforward ones "ralph-ready" and kick off auto mode. While that runs, I work on the complex ticket that actually needs my brain. By the time I finish the hard work, ralph-starter has PRs waiting for my review. I wrote about this batch workflow in more detail in [I gave ralph-starter 10 GitHub issues and went to lunch](/blog/automating-entire-workflows) -- same idea, different source.

One thing that works really well is writing acceptance criteria as a checklist in Linear:

```
Acceptance:
[ ] Endpoint returns JSON response with { data, meta } shape
[ ] Tests cover happy path and error case
[ ] No lint warnings
[ ] Build succeeds
```

ralph-starter extracts those checkboxes from the ticket body and uses them as completion criteria. The agent knows it needs to satisfy each point before signaling done. This is why [specs matter so much](/blog/specs-are-the-new-code) -- the better your Linear tickets, the better the PRs.

The tickets that work best are the ones with clear inputs and outputs. "Add this endpoint", "Fix this test", "Update this component to match the new design." The ones that need a human are where the approach is not obvious, where you need to ask "should we even build this?"

The AI does not fail when the instructions are clear. It struggles when the spec is vague.

Want to connect your Linear workspace?

```bash
npm i -g ralph-starter
ralph-starter init
ralph-starter config set linear.apiKey lin_api_your_key_here
ralph-starter run --from linear --project YOUR-PROJECT --issue YOUR-ISSUE --commit --pr
```

## References

- [I gave ralph-starter 10 issues and went to lunch](/blog/automating-entire-workflows)
- [Specs are the new code](/blog/specs-are-the-new-code)
- [ralph-starter + Claude Code setup](/blog/ralph-starter-claude-code-setup)
- [Linear integration docs](/docs/sources/linear)
- [Auto mode docs](/docs/cli/auto)
