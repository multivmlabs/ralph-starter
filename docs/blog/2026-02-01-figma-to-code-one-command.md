---
slug: figma-to-code-one-command
title: Building a full app from a Figma file in one command
authors: [ruben]
tags: [ralph-starter, figma, design-to-code, tutorial]
image: /img/blog/figma-to-code.png
---

I had a Figma file with 12 screens for a dashboard. A designer handed it to me on Friday afternoon. Normally that means a week of slicing. I turned it into working React components with one command and had a foundation ready before the weekend.

<!-- truncate -->

Ever tried manually translating Figma frames into code? You squint at the inspector, copy hex colors, guess at spacing, try to match the layout... it is painfully slow. I wanted to see what would happen if I just pointed ralph-starter at the Figma file.

The Figma integration has 5 modes. The one I use most is `components` -- it reads your Figma file and generates component code directly.

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

ralph-starter hits the Figma API, pulls every component and frame, converts the design data into specs, then the coding agent implements each one. 87 cents for a 12-screen dashboard scaffold. Not bad.

![Figma design and generated components](/img/blog/figma-to-code.png)

Now, I want to be honest: it will not be pixel-perfect on the first run. The agent works from structural data, not screenshots. But the component breakdown and layout are right, so you end up tweaking CSS instead of writing everything from scratch. I spent maybe 2 hours polishing what would have taken me 2 days.

## The 5 modes

**Spec** (default) converts frames to markdown specs. Good when you want the AI to understand design intent before writing code.

**Tokens** extracts your design system. Colors, typography, spacing. Exports to CSS, SCSS, JSON, or Tailwind:
```bash
$ ralph-starter integrations fetch figma "ABC123" --figma-mode tokens --figma-format tailwind

  Extracted design tokens:
    → 24 colors (primary, secondary, neutral, semantic)
    → 6 font sizes + 4 font weights
    → 8 spacing values
    → 4 border radius values
  Written to: tailwind.config.tokens.js
```

**Components** generates actual code. React, Vue, Svelte, Astro, Next.js, Nuxt, HTML:
```bash
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework react
```

**Assets** exports icons and images with download scripts.

**Content** extracts text content for static sites.

## What I actually did

For the dashboard I ran tokens first to get the Tailwind config, then components for the React code. Two commands, about 10 minutes total, and I had a working foundation to refine. Like Ralph Wiggum says, *"I'm helping!"* -- and honestly, the AI really was helping here.

Setup is just a personal access token from Figma:

```bash
ralph-starter config set figma.token figd_xxxxx
```

The [loop is what makes it work](/blog/my-first-ralph-loop). The agent does not generate once and stop. It generates, runs tests, sees what broke, fixes it, runs again. By loop 3 or 4 you have components that actually render and pass lint. This is the same [Ralph Wiggum technique](/blog/ralph-wiggum-technique) I use for everything else -- just pointed at a design file instead of a GitHub issue.

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
