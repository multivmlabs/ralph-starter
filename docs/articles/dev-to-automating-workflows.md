---
title: Automating entire workflows with ralph-starter
published: false
description: I gave my AI agent 10 Linear tickets and went to lunch. Here's what happened.
tags: ai, coding, automation, productivity
cover_image: https://ralphstarter.ai/img/blog/auto-mode-github.png
canonical_url: https://ralphstarter.ai/blog/2026-02-03-ten-github-issues-went-to-lunch
---

What if your Linear ticket became a PR while you were making coffee?

Not a vague "AI will change everything" kind of future. I mean right now. You label an issue, run one command, go refill your cup, and there is a pull request waiting when you get back.

I know because that is literally what I did last Tuesday.

## The workflow we all pretend is fine

Ever actually counted how many steps it takes to go from a ticket to a merged PR? I did. Here is the manual version:

1. Open Linear (or GitHub, or Jira, whatever)
2. Read the ticket
3. Open your IDE
4. Think about approach
5. Start coding
6. Hit a wall, open ChatGPT, paste context
7. Get suggestion, adapt it, paste back
8. Run tests. Something breaks
9. Go back to chat, paste the error
10. Fix it. Run tests again
11. Run lint. Fix lint
12. Commit, push, open PR

That is 12 steps. I was doing this 5 to 8 times a day. The AI was doing the hard part. I was the middleman copying text between windows.

You know what happened? I got tired of being a copy-paste relay and wrote a script to do the relay for me. That script became [ralph-starter](https://github.com/multivmlabs/ralph-starter).

## What ralph-starter actually does

ralph-starter connects to where your specs already live (GitHub issues, Linear tickets, Notion pages, Figma designs) and feeds them to an AI coding agent. Then it runs the agent in a loop: code, test, get feedback, fix, test again. When validation passes, it commits, pushes, and opens a PR. The whole thing. One command, no babysitting.

## Show me the terminal

Alright. I have a GitHub issue #42: "Add /health endpoint that returns 200 with JSON status". Clear spec, acceptance criteria, the whole thing. Here is what I run:

```bash
ralph-starter run --from github --issue 42 --commit --pr
```

And here is what actually happens:

```
ralph-starter v0.3.0

Fetching issue #42 from github...
  → "Add /health endpoint that returns 200 with JSON status"
  → Branch: auto/42-health-endpoint

Detected agent: Claude Code

Loop 1/5
  → Agent creating /health endpoint...
  → Running validation: pnpm test
  → Tests: 14 passed, 1 failed
  → Feeding error back to agent...

Loop 2/5
  → Agent fixing test assertion...
  → Running validation: pnpm test
  → Tests: 15 passed
  → Running validation: pnpm lint
  → Lint: passed
  → Running validation: pnpm build
  → Build: passed

All validations passed.

Committed: feat(api): add /health endpoint with JSON status
Pushed to origin/auto/42-health-endpoint
Created PR #58: "Add /health endpoint - closes #42"

Cost Summary:
  Tokens: 38K (27K in / 11K out)
  Cost: $0.18 (2 iterations)
  Cache savings: $0.09
  Duration: 47s
```

Two loops. 47 seconds. $0.18. I did not touch my editor.

## Pick your agent

ralph-starter does not care which coding agent you use. It detects what you have installed and works with it. Claude Code is the default (and what I use), but it also supports Cursor, OpenAI Codex, OpenCode, Gemini CLI, GitHub Copilot, Amp, and Openclaw. If you have strong feelings about your agent, keep using it. ralph-starter is the orchestrator, not the brain.

## The cost thing

People always ask about cost. Fair question. Here is what I actually spend.

Claude's prompt caching is the trick. First loop sends the full context: system prompt, spec, project files. Expensive. But loops 2, 3, 4 reuse cached tokens at 90% discount. Regular input costs $3.00 per million tokens. Cached reads cost $0.30 per million.

In practice, my average task costs **$0.12**. That is not a typo. Most tasks complete in 2 to 3 loops, and after the first loop most input tokens are cached. I tracked the whole month of January: 187 tasks, $22.41 total. Before prompt caching that same workload would have been over $200.

ralph-starter shows you the cost after each run. No surprises.

## Auto mode: the batch processor

This is the one that changed my workflow. I label 10 issues as "auto-ready" during sprint grooming. When I am ready (usually before lunch), I run:

```bash
ralph-starter auto --source github --project multivmlabs/ralph-starter --label "auto-ready" --limit 10
```

Each issue gets its own branch, its own loop, its own PR. I come back from lunch to a stack of PRs to review.

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

...

Completed: 8/10 | Failed: 2/10
Total cost: $1.84
```

8 out of 10 is my usual hit rate. The ones that fail are always the vague tickets. "Improve performance" with no details? The agent spins. "Add endpoint X that returns Y with schema Z"? Done in 2 loops every time. The circuit breaker catches stuck ones after 3 consecutive failures so you do not burn money.

Write better tickets, get better results. That is the whole secret.

## Before and after

I tracked a full week. Same types of tasks, half manual, half with ralph-starter.

| | Manual | ralph-starter |
|---|---|---|
| Time per task | 45 min | 8 min |
| Active attention | 45 min | 3 min (review PR) |
| Tests passing | Usually | Always |
| Lint passing | Sometimes | Always |
| Cost per task | $0 (your time) | $0.12 avg |
| Tasks per day | 5-8 | 15-25 |

The "8 min" for ralph-starter includes the time the agent runs plus me reviewing the PR. My actual hands-on-keyboard time is about 3 minutes. The rest I am doing something else.

The consistency is the thing I did not expect. When I code manually, I sometimes skip tests for small changes. The validation loop does not let the agent skip anything. Every PR passes tests, lint, and build. Every single one.

## Getting started

Three steps. I am not going to write a wall of text here.

```bash
# 1. Install
npx ralph-starter init

# 2. Run your first task
ralph-starter run "add a /ping endpoint that returns pong" --commit

# 3. Check the result
git log --oneline -1
```

That is it. ralph-starter detects your project, finds your agent, runs the loop. If you want to connect GitHub or Linear, the setup wizard walks you through it:

```bash
ralph-starter setup
```

## The Ralph Wiggum thing

Why "ralph"? The name comes from the [Ralph Wiggum technique](https://ghuntley.com/ralph/). You give the AI a task and let it keep going until done. No back-and-forth prompting. Just "here is the spec, go build it, here are the tests to pass." Like Ralph: he does not overthink, he just does.

I know naming your tool after a Simpsons character is not exactly enterprise-ready branding. But honestly? Every time the agent finishes a task I hear "I'm helping!" in my head and it makes me smile. We spend too many hours coding to not have fun with it.

## Try it

ralph-starter is open source, MIT licensed, and you can start using it in about 30 seconds.

- **GitHub**: [github.com/multivmlabs/ralph-starter](https://github.com/multivmlabs/ralph-starter)
- **Docs**: [ralphstarter.ai](https://ralphstarter.ai)
- **npm**: [npmjs.com/package/ralph-starter](https://www.npmjs.com/package/ralph-starter)

If you use it, I would love to hear what you think. Open an issue, drop a star, or tell me I am crazy on Twitter. All valid.

[![npm version](https://img.shields.io/npm/v/ralph-starter.svg?style=flat-square)](https://www.npmjs.com/package/ralph-starter) [![npm downloads](https://img.shields.io/npm/dm/ralph-starter.svg?style=flat-square)](https://www.npmjs.com/package/ralph-starter)
