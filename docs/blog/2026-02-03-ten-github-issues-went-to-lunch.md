---
slug: automating-entire-workflows
title: Automating entire workflows with ralph-starter
authors: [ruben]
tags: [ralph-starter, auto-mode, github, batch-processing, ralphwiggum]
image: /img/blog/auto-mode-github.png
description: ralph-starter runs Ralph Wiggum loops. Fetch a spec, run the AI agent, check tests/lint/build, feed errors back, repeat. Here is how it works and why I built it.
---

[ralph-starter](https://github.com/multivmlabs/ralph-starter) is a CLI tool that orchestrates AI coding agents in autonomous loops. You give it a task (or point it at a GitHub issue, a Linear ticket, a Notion page), it runs the agent, checks if tests pass, if lint is clean, if build works. If something fails it feeds the error back to the agent and loops again. When everything passes it commits, pushes, and opens a PR.

<!-- truncate -->

It supports Claude Code, Cursor, Codex CLI, OpenCode, Gemini CLI, Copilot, Amp, and Openclaw. You do not need to pick one in advance, it auto-detects what you have installed.

It is open source, MIT licensed. I built it because I was tired of being the middleman between my terminal and my AI chat window.

## Why I built it

I was using AI coding assistants every day. Claude, ChatGPT, Copilot, whatever was available. And the workflow was always the same: I read a ticket, I open the editor, I start coding, I get stuck, I open the AI chat, I paste the context, I get a suggestion, I adapt it, I paste it back. Then I run tests. Something breaks. I go back to the chat, paste the error, get a fix, paste that back. Lint complains. Another round trip. Then I commit, push, open a PR.

That is like 12 steps and I was doing it 5 to 8 times a day. The AI was doing the hard part (writing the code) and I was just the relay moving text between windows. I felt like a human clipboard.

So I wrote a script that does the relay for me. The script takes a spec, sends it to the agent, runs my test suite, and if something fails it sends the error output back to the agent automatically. No copying, no pasting, no switching windows. The agent sees the error and fixes it on its own.

That script grew into ralph-starter.

## Where it is most useful

ralph-starter works best when you have:

1. **A clear spec.** "Add /health endpoint that returns 200 with JSON body `{ status: 'ok' }`" finishes in 1 loop. "Make the app better" will still run, the agent will analyze your codebase and pick something to improve, but it might take 4 loops and the result might not be what you wanted. The more specific the spec, the fewer loops and the better the output.
2. **Tests.** The loop needs something to validate against. If you have no tests the agent does not know when it is done.
3. **Routine implementation work.** Endpoints, bug fixes, component updates, adding tests, config changes. The stuff that fills up a sprint backlog.

Vague specs do not break it, they just cost more. "Refactor the auth system" with no details will make the agent try different approaches each loop until the circuit breaker trips. "Add JWT middleware at src/middleware/auth.ts using bcrypt, httpOnly cookies, add tests for login success and failure" finishes in 2 loops because the agent knows exactly what done looks like.

I use it every day for the mechanical parts of development. I still do the thinking, the architecture, the spec writing. ralph-starter handles the translation from spec to code.

## Getting started

You can start from an idea and ralph-starter will generate the spec for you. Or you can point it at an existing GitHub issue or Linear ticket and it fetches the spec automatically.

```bash
# Install and initialize
npx ralph-starter init
```

`ralph-starter init` detects your project type (Node.js, Python, Rust, Go), finds which agents you have installed, and sets up your validation commands (test, lint, build). If it finds a Ralph Playbook in your project it picks up AGENTS.md, IMPLEMENTATION_PLAN.md, and your prompt files automatically.

Run your first task with an inline spec:

```bash
ralph-starter run "add a /ping endpoint that returns pong" --commit
```

Or point it at a GitHub issue or Linear ticket:

```bash
# From GitHub
ralph-starter run --from github --project rubenmarcus/ralph-starter --issue 2

# From Linear
ralph-starter run --from linear --project ENG --issue ENG-71 --commit --pr
```

To connect GitHub, Linear, Notion, or Figma as spec sources, use the config commands:

```bash
ralph-starter config set github.token ghp_xxx
ralph-starter config set linear.apiKey lin_api_xxx
ralph-starter config set notion.apiKey ntn_xxx
```

`ralph-starter setup` configures the CLI agent preferences. Integrations are managed through `ralph-starter config`.

## How the loop works

The loop executor follows this sequence:

```
1. Fetch spec (GitHub issue, Linear ticket, inline text)
2. Create branch (auto/42-health-endpoint)
3. Run agent with the spec as prompt
4. Run validations: test → lint → build
5. If any validation fails → feed error output back to agent → go to step 3
6. If all pass → commit, push, open PR
```

The validation step is configurable in `ralph-starter.config.yaml`:

```yaml
validation:
  test: pnpm test
  lint: pnpm lint
  build: pnpm build
```

When a validation fails, ralph-starter takes the stderr/stdout and builds context for the next iteration. The context includes the original spec, the diff of what changed, and the full validation output. The agent sees `TypeError: Cannot read property 'id' of undefined at src/routes/user.ts:42` and knows exactly what to fix.

The agent does not get a summary. It gets the raw error. This is faster than me copying the error into a chat window because there is zero delay between failure and the next attempt.

## Real example: building a landing page from a GitHub issue

Here is a real run. I pointed ralph-starter at a GitHub issue that asked for a landing page for a London pet shop. The spec had 8 tasks (header, hero, services, gallery, testimonials, contact form, footer, polish).

ralph-starter detected 28 installed skills (frontend-design, tailwind, responsive-web-design, etc.), picked the relevant ones for the task, and started the loop with Claude Code.

The loop ran for 2 iterations. First iteration completed 5 out of 8 tasks (Project Setup, Header & Navigation, Hero Section, Services Section, Featured Pets Gallery). Second iteration picked up the remaining tasks (Testimonials, Contact Form, Footer, Polish). It stopped automatically when no file changes were detected for 2 consecutive iterations.

Final result:

```
Cost Summary:
  Tokens: 47.0K (764 in / 46.2K out)
  Cost: $0.606 ($0.348/iteration avg)

Loop completed!
  Exit reason: completed
  Iterations: 2
  Total duration: 8m 19s
  Total cost: $0.696 (47.0K tokens)
```

8 minutes. 69 cents. A full landing page with React components, Tailwind styling, and responsive layout. I did not open the editor at all.

## Token costs and how to keep them low

This is something people always ask me about. Here are my real numbers.

I tracked my entire January. 187 tasks completed. $22.41 total. Average of **$0.12 per task**.

The reason it is cheap is prompt caching. When using Claude Code, the first loop sends the full context at $3.00 per million input tokens. But loops 2, 3, 4 reuse the cached tokens at $0.30 per million. That is 90% less.

Before each run, ralph-starter shows you an estimate so you know what to expect. After each run it shows the actual cost breakdown: tokens in, tokens out, cache hits, cost per iteration. No surprises. You always know what you are spending.

Most tasks finish in 2 to 3 loops. After the first loop, most of the input is already cached. I wrote the detailed breakdown with exact numbers [here](/blog/prompt-caching-saved-me-47-dollars).

A few things that help keep costs down:
- **Good specs** mean fewer loops. Clear acceptance criteria = agent knows when it is done.
- **Prompt caching** saves 90% on input tokens after the first loop.
- **Circuit breaker** stops tasks that are stuck, so you do not burn money on something unsolvable.
- **Skills** teach the agent patterns so it gets things right faster (fewer iterations = less cost).

## Batch mode: 10 issues, 8 PRs

During sprint grooming I label issues as "auto-ready". These are the well defined tickets with clear specs. Then I run a single command and go get lunch:

ralph-starter picks up all matching issues, shows the estimate for each, and starts the Ralph Wiggum loop one by one:

```bash
# From GitHub
ralph-starter auto --source github --project multivmlabs/ralph-starter --label "auto-ready" --limit 10

# From Linear
ralph-starter auto --source linear --project ENG --label "auto-ready" --limit 10
```

It works with both GitHub Issues and Linear tickets. Each issue gets its own branch, its own loop, its own PR:

```
[1/10] Issue #145: Add health check endpoint
  > Branch: auto/145
  > 2 loops > Validation: passed
  > PR #151 created

[2/10] Issue #147: Add rate limit headers
  > Branch: auto/147
  > 1 loop > Validation: passed
  > PR #152 created

[3/10] Issue #150: Improve performance
  > 3 loops > Circuit breaker tripped. Skipping.

...

Completed: 8/10 | Failed: 2/10
Total cost: $1.84
```

8 out of 10. The 2 that failed were vague tickets. One was "Improve performance" with no metrics or targets. The agent tried different optimizations each loop but had nothing to validate against. The circuit breaker tripped after 3 loops.

The other was a refactoring ticket that referenced a discussion from a team meeting. The agent did not have that context.

The circuit breaker trips after 3 consecutive identical failures or 5 of the same error type. It prevents burning tokens on something the agent cannot solve.

## Picking an agent

You can be explicit about which agent to use:

```bash
ralph-starter run "your task" --agent claude-code
ralph-starter run "your task" --agent codex
ralph-starter run "your task" --agent cursor
```

Or let ralph-starter auto-detect. It checks what you have installed and uses the first one it finds.

I use Claude Code daily because prompt caching makes the loops cheaper and stream-json output lets ralph-starter track progress in real time. But the loop executor and validation pipeline are the same for all agents. I ran the same JWT auth task on [4 different agents](/blog/five-ai-coding-agents) and they all got there, just with different loop counts and costs.

## Why I keep building it

I did a [side-by-side comparison](/blog/ralph-starter-vs-manual) of 12 tasks from the same sprint. 6 manual, 6 with ralph-starter. Same project, same type of work. The ralph-starter tasks averaged 12 minutes of my attention vs 45 minutes coding manually. Code quality was comparable.

Now I spend my time on three things: writing clear specs (the input), reviewing PRs (the output), and architecture decisions (the part the AI cannot do). Everything in between, the mechanical translation of spec to code, ralph-starter handles that.

Every PR it produces passes tests, lint, and build. Every one. When I code manually I sometimes skip tests for small changes. The validation loop does not let the agent skip anything and honestly that discipline is better than what I do on my own.

## About the name

The name comes from the [Ralph Wiggum technique](https://ghuntley.com/ralph/). You give the AI a task and let it keep going until done. No micro-managing. [Full explanation here](/blog/ralph-wiggum-technique).

## Links

ralph-starter is open source, MIT licensed.

- [GitHub](https://github.com/multivmlabs/ralph-starter)
- [Docs](https://ralphstarter.ai)
- [npm](https://www.npmjs.com/package/ralph-starter)

Related posts:
- [The Ralph Wiggum technique](/blog/ralph-wiggum-technique)
- [Specs are the new code](/blog/specs-are-the-new-code)
- [I tried 5 AI coding agents with ralph-starter](/blog/five-ai-coding-agents)
- [Prompt caching saved me $47](/blog/prompt-caching-saved-me-47-dollars)
- [ralph-starter vs doing it manually](/blog/ralph-starter-vs-manual)
- [Building a full app from a Figma file in one command](/blog/figma-to-code-one-command)
- [How I use ralph-starter with Linear every day](/blog/ralph-starter-with-linear)

If you try it, open an issue or drop a star. All feedback is welcome.
