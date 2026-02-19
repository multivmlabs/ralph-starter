---
slug: figma-to-code-one-command
title: Building a full app from a Figma file in one command
authors: [ruben]
tags: [ralph-starter, figma, design-to-code, tutorial]
description: Pointed ralph-starter at a 12-screen Figma dashboard file and had working React components before the weekend. 87 cents total.
image: /img/blog/figma-to-code.png
---

A designer handed me a Figma file on Friday afternoon with 12 screens for a dashboard. My immediate thought was "cool, that is next week gone." Instead I pointed ralph-starter at it and had working React components before I left for the weekend.

<!-- truncate -->

You know the Figma-to-code dance. Squint at the inspector panel. Copy hex colors one at a time. Guess at spacing values. Eyeball the layout. Realize the padding was 24 not 20. Go back. Fix it. Repeat for every single frame. I have lost days of my life to this.

So I tried something. I just pointed ralph-starter at the Figma file to see what would happen. Honestly expected it to fall apart. It did not.

The integration has 5 modes. The one I reach for most is `components` -- it reads your Figma file and generates actual component code.

```bash
$ ralph-starter run --from figma \
  --project "https://figma.com/file/ABC123/Dashboard" \
  --figma-mode components \
  --figma-framework react \
  --loops 5 --test --commit

🔄 Loop 1/5
  → Fetching from Figma API... 12 frames, 34 components found
  → Generating implementation plan...
  → Writing code with Claude Code...
  → Created: 14 files in src/components/
  → Running tests... 8 passed, 3 failed

🔄 Loop 2/5
  → Fixing import paths and missing props...
  → Running tests... 10 passed, 1 failed

🔄 Loop 3/5
  → Fixing: Sidebar component missing responsive breakpoint...
  → Running tests... 11 passed ✓
  → Running lint... clean ✓
  → Committing changes...

✅ Done in 4m 18s | Cost: $0.87 | Tokens: 67,412
```

What happens under the hood: ralph-starter hits the Figma API, pulls every component and frame, converts the design data into specs, and the coding agent implements each one. 87 cents for a 12-screen dashboard scaffold. I checked the number twice.

It is not pixel-perfect -- the agent works from structural data, not screenshots. But the component breakdown and layout are right, so you end up tweaking CSS values instead of writing everything from scratch. I spent maybe 2 hours polishing what would have taken me 2 full days.

## The 5 modes (yes, there are 5)

**Spec** (default) converts frames to markdown specs. I use this when I want the AI to understand the design intent before touching any code.

**Tokens** extracts your design system -- colors, typography, spacing. Exports to CSS, SCSS, JSON, or Tailwind. This one was a pleasant surprise:
```bash
$ ralph-starter integrations fetch figma "ABC123" --figma-mode tokens --figma-format tailwind

  Extracted design tokens:
    → 24 colors (primary, secondary, neutral, semantic)
    → 6 font sizes + 4 font weights
    → 8 spacing values
    → 4 border radius values
  Written to: tailwind.config.tokens.js
```

**Components** generates actual code. React, Vue, Svelte, Astro, Next.js, Nuxt, HTML -- pick your poison:
```bash
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework react
```

**Assets** exports icons and images with download scripts.

**Content** extracts text content for static sites.

## What I actually did with the dashboard

I ran tokens first to get the Tailwind config right, then components for the React code, two commands in maybe 10 minutes total. And I had a working foundation to start refining.

Setup is dead simple, just a personal access token from Figma:

```bash
ralph-starter config set figma.token figd_xxxxx
```

The reason this works at all is [the loop](/blog/my-first-ralph-loop). The agent does not just generate code and stop. It generates, runs tests, sees what broke, fixes it, runs again. By loop 3 or 4 you have components that actually render and pass lint. Same [Ralph Wiggum technique](/blog/ralph-wiggum-technique) I use for everything else -- just pointed at a design file instead of a GitHub issue. I did not even plan it this way. It just... worked.

Want to try it with your own Figma file?

```bash
npx ralph-starter init
ralph-starter config set figma.token figd_your_token_here
ralph-starter run --from figma --project "your-figma-url" --figma-mode components --figma-framework react --loops 5
```

## References

- [My first ralph loop: what actually happens](/blog/my-first-ralph-loop)
- [The Ralph Wiggum technique](/blog/ralph-wiggum-technique)
- [Specs are the new code](/blog/specs-are-the-new-code)
- [Figma integration docs](/docs/sources/figma)
- [Workflow presets](/docs/guides/workflow-presets)
