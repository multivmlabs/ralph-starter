---
slug: figma-to-code-one-command
title: Building a full app from a Figma file in one command
authors: [ruben]
tags: [ralph-starter, figma, design-to-code, tutorial]
image: /img/blog/figma-to-code.png
---

I had a Figma file with 12 screens for a dashboard. Turned it into working React components with one command.

<!-- truncate -->

The Figma integration has 5 modes. The one I use most is `components`, reads your Figma file and generates component code.

```bash
ralph-starter run --from figma \
  --project "https://figma.com/file/ABC123/Dashboard" \
  --figma-mode components \
  --figma-framework react \
  --loops 5 --test --commit
```

ralph-starter hits the Figma API, pulls every component and frame, converts design into specs, then the coding agent implements each one.

![Figma design and generated components](/img/blog/figma-to-code.png)

Won't be pixel-perfect first run. Agent works from structural data not screenshots. But component breakdown and layout are right, so you end up tweaking CSS instead of writing from scratch.

## The 5 modes

**Spec** (default) converts frames to markdown specs. Good when you want AI to understand design intent first.

**Tokens** extracts design system. Colors, typography, spacing. Exports to CSS, SCSS, JSON, or Tailwind:
```bash
ralph-starter integrations fetch figma "ABC123" --figma-mode tokens --figma-format tailwind
```

**Components** generates actual code. React, Vue, Svelte, Astro, Next.js, Nuxt, HTML:
```bash
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework react
```

**Assets** exports icons and images with download scripts.

**Content** extracts text content for static sites.

## What I did

For the dashboard I ran tokens first to get Tailwind config, then components for React code. Two commands, about 10 minutes, working foundation to refine.

Setup is just a personal access token from Figma:

```bash
ralph-starter config set figma.token figd_xxxxx
```

The loop is what makes it work. Agent does not generate once and stop. Generates, runs tests, sees what broke, fixes, runs again. By loop 3 or 4 you have components that render and pass lint.

## References

- [Figma integration docs](/docs/sources/figma)
- [Workflow presets](/docs/guides/workflow-presets)
