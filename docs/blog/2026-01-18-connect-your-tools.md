---
slug: connect-your-tools
title: From spec to code in one command
authors: [ruben]
tags: [integrations, github, linear, notion, workflow]
description: Your specs already live in GitHub, Linear, or Notion. One command pulls them into ralph-starter and starts coding.
image: /img/blog/linear-workflow.png
---

Every feature you build starts with a spec that already exists somewhere. GitHub issue, Linear ticket, Notion doc. It's already written. The annoying part is getting it into your AI tool without losing half of it.

<!-- truncate -->

## The problem I kept running into

I'd open a GitHub issue, read through the description and comments, mentally summarize it, then type a prompt for Claude that captured... maybe 60% of what was actually in the issue. The linked design doc? Forgot to include it. The acceptance criteria someone added in comment #3? Missed that too.

The spec was right there. I was just a really bad copy-paster. And you know what's dumb? I did this for months before it occurred to me that a script could just fetch the issue directly.

## So I made it one command

ralph-starter just pulls the spec directly and feeds it to the agent:

```bash
ralph-starter run --github "myorg/api#42" --loops 5 --test --commit
```

What happens here: it authenticates with GitHub using your existing `gh` CLI session, grabs issue #42 -- body, all comments, labels, linked references, everything -- and hands it all to the coding agent. Then the agent implements the feature, runs your tests after each loop, and commits when everything passes.

No tab-switching. No summarizing. No "let me paste the relevant parts." The agent gets the raw spec, the whole thing.

## GitHub issues and PRs

This is the one I use the most, by far. Just point it at an issue:

```bash
ralph-starter run --github "owner/repo#123"
```

It pulls the title, body, comments, file references. If the issue links to other issues, those come along too. Basically the agent sees everything your team wrote -- which is usually way more context than what I'd remember to paste.

PRs work the same way, which is great for when you get review feedback and don't want to fix 12 nits by hand:

```bash
ralph-starter run --github "owner/repo#456" --loops 3 --test
```

## Linear tickets

If your team uses Linear, same deal:

```bash
ralph-starter run --linear "PROJ-123" --commit
```

Grabs the ticket description, sub-issues, attachments, priority. One thing I've noticed: Linear tickets tend to be really well-structured compared to GitHub issues, so the agent gets cleaner input and the results are usually better on the first try. Not always, but noticeably.

## Notion pages

For teams that write everything in Notion (I've been there):

```bash
ralph-starter run --notion "page-id" --loops 5 --test
```

The page content gets converted to markdown, and child pages and linked databases come along for the ride. This is especially nice for those longer specs -- you know, the ones with 3 sections and a table and a "Notes from the last meeting" block. Try pasting all of that into a chat window. Actually, don't.

## Local files and URLs

Sometimes the spec is just a markdown file in your repo:

```bash
ralph-starter run --from ./specs/auth-feature.md --test --commit
```

Or a URL:

```bash
ralph-starter run --from "https://example.com/spec.md"
```

## Combining sources (this is the good part)

OK so the thing I actually use the most in practice is combining a GitHub issue with extra local context:

```bash
ralph-starter run \
  --github "owner/repo#123" \
  --from ./docs/api-conventions.md \
  --loops 5 \
  --test \
  --commit
```

The agent gets the issue spec plus your project conventions in one shot. This is where the quality jumps noticeably. Before I started doing this, the agent would generate code that worked but didn't follow our patterns -- wrong naming conventions, different error handling style, that kind of thing. Now it matches the rest of the codebase on the first try most of the time.

## Setting up auth

One-time setup, takes like 30 seconds:

```bash
# GitHub (uses your existing gh CLI login)
gh auth login

# Linear
ralph-starter config set linear.apiKey lin_api_xxx

# Notion
ralph-starter config set notion.token secret_xxx
```

---

The full list of supported sources is in the [integrations guide](/docs/sources/overview).
