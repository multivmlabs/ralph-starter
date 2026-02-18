---
slug: validation-driven-development
title: Let your tests guide the AI
authors: [ruben]
tags: [testing, validation, quality, best-practices]
description: AI-generated code that looks perfect can blow up at runtime. Adding tests to the loop lets the agent catch and fix its own mistakes.
image: /img/blog/specs-new-code.png
---

The first time I let an AI agent write code without running tests, it produced something that looked perfect. Clean code, nice comments, the works. Blew up at runtime. The second time, I added `--test` and the agent caught its own mistake and fixed it in the next loop. That's when I realized: the tests aren't just for me anymore. They're for the agent.

<!-- truncate -->

## How this actually works

So when you pass `--test` to ralph-starter, every loop ends with your test suite running. If something fails, the error output goes straight back into the agent's context. It reads the failure, figures out what it got wrong, and tries again. Basically your tests become the agent's to-do list.

```bash
ralph-starter run "add Stripe webhook handler" \
  --test \
  --lint \
  --loops 5
```

Here's what that actually looked like on a Stripe webhook handler I built last week:

```
Loop 1: Implementing webhook handler...
  → Running tests...
  FAIL src/webhooks/stripe.test.ts
    x should verify webhook signature (8ms)
      Error: No signatures found matching the expected signature for payload

  → 1 test failed. Feeding errors back to agent.

Loop 2: Fixing signature verification...
  → Added raw body parsing middleware for webhook route
  → Running tests...
  PASS src/webhooks/stripe.test.ts
    ✓ should verify webhook signature (12ms)
    ✓ should handle checkout.session.completed (5ms)
    ✓ should return 400 for unknown events (3ms)
  → Running linter... 1 issue
    src/webhooks/stripe.ts:14:7 - 'event' is defined but never used

Loop 3: Removing unused variable...
  → Running tests... passed
  → Running linter... passed

Done in 3 loops.
```

The thing that blew my mind: the agent saw `No signatures found matching the expected signature for payload` and just... knew it needed raw body parsing. I didn't tell it that. The test output was specific enough. That's the Stripe webhook gotcha that trips up every developer the first time, and the agent figured it out from the error message alone. Took me like 20 minutes of Googling when I first hit it myself.

## Your tests are basically the spec

This flips the whole workflow on its head. Instead of describing what you want in a prompt and hoping the output is correct, you write tests that define correct behavior and let the agent figure out the implementation.

If you already do TDD, this is basically what you've been training for. Write your tests first, then:

```bash
ralph-starter run "make the failing tests pass" --test --loops 5
```

Each failing test becomes a requirement. When they all pass, the task is done. It's weirdly satisfying to watch.

## Setting it up

In your config file, just tell ralph-starter what to run:

```yaml
# ralph.config.yaml
validation:
  test: "pnpm test"
  lint: "pnpm lint"
  build: "pnpm build"
```

Or pass them as flags:

```bash
ralph-starter run "fix the auth bug" \
  --test "pytest -x" \
  --lint "ruff check ."
```

That `-x` flag on pytest is a pro tip, by the way. It stops at the first failure, so the agent gets one focused error instead of a wall of 47 failures. Way more useful.

## What I've learned about good validation setups

**Fast tests matter a lot.** The agent runs your suite on every loop. If your tests take 10 minutes, a 5-loop run takes close to an hour. If they take 10 seconds, you're done in a few minutes. I learned this the hard way on a project with a 7-minute test suite. Now I usually point the agent at a subset:

```bash
ralph-starter run "fix payment processing" \
  --test "pnpm test -- --testPathPattern=payment"
```

**Specific error messages make a huge difference.** Compare these two test failures:

```
# Bad: agent has to guess what went wrong
AssertionError: expected false to be true
```

```
# Good: agent knows exactly what to fix
Expected status code 201 for POST /api/users
Received status code 400 with body: {"error": "email is required"}
```

The first one? The agent basically has to guess. The second one tells it exactly what's missing. More information in your test output = fewer loops = less money. It's that simple.

**Type checking is worth adding too.** It catches a totally different class of bugs. I add it as another validator:

```yaml
validation:
  test: "pnpm test"
  lint: "pnpm lint"
  typecheck: "pnpm tsc --noEmit"
```

Every validator runs after every loop, and the agent doesn't move on until all of them pass. It's like having a really patient code reviewer that never gets tired.

## When to skip auto-commit

I'll be honest, I don't always trust the agent enough to commit automatically. When I'm trying a new type of task, I run without `--commit` first so I can look at the diff:

```bash
ralph-starter run "add rate limiting" --test --lint --loops 5

# Review what the agent did
git diff

# Commit if it looks good
git add -A && git commit -m "feat: add rate limiting"
```

Once I trust the pattern for a given type of task, I add `--commit` and let it ship. That trust builds over time. Took me maybe a week before I stopped reviewing every diff.

---

Details on all the validation options are in the [validation config docs](/docs/advanced/validation).
