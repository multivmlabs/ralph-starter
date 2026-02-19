---
slug: why-i-built-ralph-starter
title: Why I built ralph-starter
authors: [ruben]
tags: [ralph-starter, story, ai-coding, open-source]
description: I was copy-pasting between ChatGPT and my editor 20 times a day. So I wrote a bash script that did it for me. That script became ralph-starter.
image: /img/blog/why-i-built-ralph-starter.png
---

Do you know when you have a GitHub issue with the full spec, and then you open Claude or ChatGPT, copy the issue, paste there, get code back, paste in your editor, run tests, something breaks, go back to chat, paste the error? I was doing this 20 times a day. Twenty. I counted.

<!-- truncate -->

The AI was doing the hard part. I was just the middleman moving text around. A glorified clipboard manager, basically.

So one night I wrote a bash script. Nothing fancy -- it pulled the issue body with `gh`, piped it into Claude Code, ran the tests, and if they failed it sent the error back and let Claude try again. I ran it, went to make coffee, came back. There was a working PR sitting there. I had not touched my keyboard once.

That was the moment. I literally said out loud: "why was I doing this by hand?"

That script became ralph-starter.

Here is what it looks like now:

```bash
$ ralph-starter run --from github --project myorg/myrepo --issue 42 --commit --pr

🔄 Loop 1/5
  → Fetching spec from GitHub issue #42...
  → Generating implementation plan...
  → Writing code with Claude Code...
  → Running tests... 3 passed, 1 failed

🔄 Loop 2/5
  → Fixing test failures...
  → Running tests... 4 passed ✓
  → Committing changes...
  → Opening PR #87...

✅ Done in 2m 34s | Cost: $0.08 | Tokens: 12,847
```

Your specs already live somewhere -- GitHub, Linear, Notion, Figma. There is no reason to copy them manually into a chat window.

One command. Fetches the spec, makes a branch, runs the AI in loops with your tests as the guardrails, commits, opens a PR. You review it like any other PR from your team. No ceremony.

I use this every day now. Linear tickets in the morning, ralph-starter processes them while I work on the hard stuff, and I review PRs after lunch. It does not replace thinking about architecture -- but it handles the mechanical part of turning specs into code. The part that was eating my day.

The name comes from the [Ralph Wiggum technique](/blog/ralph-wiggum-technique). As Ralph would say: *"I'm learnding!"* -- and honestly, that is exactly what the loop does. You give the AI a task and let it keep going until done. No prompting back and forth. Just autonomous iteration.

ralph-starter is open source because AI coding tooling is evolving so fast that the community can push it further than I could alone. And honestly, I want to see what people build with it.

If you want to try it:

```bash
npx ralph-starter init
```

## References

- [My first ralph loop: what actually happens](/blog/my-first-ralph-loop)
- [ralph-starter + Claude Code: the full setup](/blog/ralph-starter-claude-code-setup)
- [The Ralph Wiggum technique explained](/blog/ralph-wiggum-technique)
- [GitHub repo](https://github.com/multivmlabs/ralph-starter)
- [Getting started docs](/docs/intro)
- [npm package](https://www.npmjs.com/package/ralph-starter)
