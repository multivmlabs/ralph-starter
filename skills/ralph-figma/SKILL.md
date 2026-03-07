---
description: Extract Figma designs and build them as code with ralph-starter
disable-model-invocation: true
---

Extract a Figma design and build it as production code.

1. Use `ralph_fetch_spec` with `source: "figma"` and the Figma file URL as `identifier`
   - Modes: `spec` (full design spec), `tokens` (CSS/Tailwind design tokens), `components` (component code), `content` (text/IA), `assets` (icons/images)
2. Review the extracted spec — check colors, typography, spacing, and component structure
3. Use `ralph_run` to build the implementation:
   - Set `from: "figma"` to fetch directly from the Figma source
   - The agent iterates until the UI matches the design spec
   - Validation runs between iterations to catch issues early

Supported frameworks: React, Vue, Svelte, Astro, Next.js, Nuxt, HTML.
