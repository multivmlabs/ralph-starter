---
slug: why-autonomous-coding
title: Why autonomous AI coding loops work
authors: [ruben]
tags: [ai, coding, automation]
description: I spent months copy-pasting between ChatGPT and my editor before I realized the loop itself was the problem, not the AI.
image: /img/blog/ralph-wiggum-technique.png
---

I spent months copy-pasting code between ChatGPT and my editor before I realized I was the bottleneck.

<!-- truncate -->

## The back-and-forth tax

You know the drill. Open ChatGPT, describe what you want, get some code back, paste it into your editor, run it, something breaks, copy the error, go back to the chat, paste the error, get a new version, paste that in. I was doing this maybe 15-20 times a day. For months.

And every round trip you lose a little bit of context. The model half-forgets what it suggested two messages ago. You lose track of which version you pasted where. Meanwhile you're the one running tests, reading stack traces, deciding what to try next.

I realized at some point that the AI was doing the easy part -- generating code -- and I was doing everything else. I was basically a clipboard manager with opinions.

## What if the agent just... kept going?

So the idea behind ralph-starter is stupid simple. Instead of you being the middleman, the agent does the whole thing:

```bash
ralph-starter run "add user authentication with JWT" --loops 5 --test --commit
```

It reads your codebase, writes code, runs your tests. If something fails, it reads the error and fixes it. Then runs tests again. Over and over until things pass or it runs out of loops. You just... go do something else.

Here's a real run from last week:

```
Loop 1: Read codebase, generated auth middleware and routes
  → Tests: 3 failed (missing bcrypt import, wrong token expiry, no error handler)

Loop 2: Fixed imports, updated token config, added error handling
  → Tests: 1 failed (error handler not catching expired tokens)

Loop 3: Added expired token case to error handler
  → Tests: passed
  → Lint: 2 warnings (unused import, missing return type)

Loop 4: Cleaned up lint issues
  → Tests: passed, Lint: passed, Build: passed
  → Committed: feat: add JWT authentication
```

Four loops, zero copy-pasting, zero babysitting. I reviewed the diff after and it was clean. I literally made coffee during loop 2.

## Why this works better than chatting

The big difference is context. In a chat, the model kind of forgets what it tried two messages ago. In a loop, the agent sees everything -- its own previous attempts, the full test output, the whole history. It doesn't start over each time.

And errors become free instructions, which is the part that really clicked for me. When `TypeError: Cannot read properties of undefined` shows up in the test output, the agent gets that exact string. You don't have to describe the problem. It reads the stack trace and acts on it. That's the stuff I was doing manually before, and honestly the agent is better at it than me because it doesn't skip lines.

A chat session might take 15-20 messages to land on working code. A loop usually finishes in 3-5 iterations because each one does real work, validates it, and course-corrects. You're paying for results, not conversation.

## Where it actually works (and where it doesn't)

I should be honest -- this isn't magic. It works really well when you have:

- **A clear spec.** "Add password reset flow per the design in issue #42" works great. "Make the auth better" does not.
- **Tests.** Even crappy ones. Tests give the agent a finish line. Without them it's just vibes.
- **A linter and type checker.** More automated checks = more signal for the agent to self-correct.

The tasks where I've had the best results: implementing a well-scoped feature from a GitHub issue, fixing a bug with a reproducible test case, refactoring code that has good coverage.

Where it falls apart: vague requirements with no tests, greenfield projects with no structure yet, anything that needs human judgment about UX. I tried it on a "redesign the dashboard" task once and... yeah. Don't do that.

## It gets even better with real specs

One more thing that made a huge difference. Instead of writing a prompt from scratch, you can point it at an actual GitHub issue:

```bash
ralph-starter run --github "myorg/api#42" --loops 5 --test --commit
```

This fetches the full issue body, comments, linked context -- all of it. The agent gets the same spec your team wrote for a human developer. Except it doesn't skim. It reads the whole thing, every comment, every acceptance criterion. Honestly it's more thorough than I am.

---

If you want to try it, [the quickstart takes about two minutes](/docs/intro).
