---
slug: why-i-built-ralph-starter
title: Why I built ralph-starter
authors: [ruben]
tags: [ralph-starter, story, ai-coding, open-source]
image: /img/blog/why-i-built-ralph-starter.png
---

Do you know when you have a GitHub issue with the full spec, and then you open Claude or ChatGPT, copy the issue, paste there, get code back, paste in your editor, run tests, something breaks, go back to chat, paste the error? I was doing this 20 times a day.

<!-- truncate -->

The AI was doing the hard part. I was the middleman moving text around.

So I wrote a script. It pulled the issue body with `gh`, sent it to Claude Code, ran the tests, and if they failed it sent the error back and tried again. I ran it and went to make coffee. When I came back there was a working PR.

![Terminal showing ralph-starter run completing a loop](/img/blog/why-i-built-ralph-starter.png)

That script became ralph-starter.

Your specs already live somewhere. GitHub, Linear, Notion, Figma. Why are you copying them manually into a chat?

```bash
ralph-starter run --from github --project myorg/myrepo --label "ready" --commit --pr
```

One command. Fetches the spec, makes a branch, runs the AI in loops with your tests as guide, commits, opens a PR. You review it like any PR from your team.

I use this every day now. Linear tickets in the morning, ralph-starter processes them, I review PRs after lunch. Does not replace thinking about architecture but handles the mechanical part of turning specs into code.

The name comes from the [Ralph Wiggum technique](/blog/ralph-wiggum-technique). You give the AI a task and let it keep going until done. No prompting back and forth.

ralph-starter is open source because AI coding tooling is evolving fast and the community can push it further than I could alone.

## References

- [GitHub repo](https://github.com/multivmlabs/ralph-starter)
- [Getting started](/docs/intro)
- [npm package](https://www.npmjs.com/package/ralph-starter)
