---
sidebar_position: 5
title: Figma
description: Fetch design specs, tokens, components, and assets from Figma
keywords: [figma, design, tokens, components, assets, integration]
---

# Figma Source

Fetch design specifications, design tokens, component code, and assets from Figma to power your AI coding loops.

## Features

| Mode | Description |
|------|-------------|
| **spec** | Convert Figma frames to markdown design specifications |
| **tokens** | Extract colors, typography, shadows to CSS/SCSS/JSON/Tailwind |
| **components** | Generate React, Vue, Svelte, or HTML component code |
| **assets** | Export icons and images with download scripts |
| **content** | Extract text content and apply to existing templates |

## Authentication

### Personal Access Token

1. Go to **Figma** → **Settings** → **Account** → **Personal Access Tokens**
2. Click **Create a new personal access token**
3. Copy the token

```bash
ralph-starter config set figma.token <your-token>
```

## Usage

### Basic Usage

```bash
# Fetch design spec from a Figma file
ralph-starter run --from figma --project "https://figma.com/file/ABC123/MyDesign"

# Using file key directly
ralph-starter run --from figma --project "ABC123"
```

### Mode: Design Spec (default)

Converts Figma frames into markdown specifications for AI coding loops:

```bash
# Fetch entire file
ralph-starter integrations fetch figma "ABC123"

# Fetch specific frames by node ID
ralph-starter integrations fetch figma "ABC123" --figma-nodes "1:23,1:45"
```

Output includes:
- Frame hierarchy with headings
- Dimensions and layout information
- Auto-layout properties (flex, gap, padding)
- Typography details
- Component properties and variants
- Visual effects (shadows, blur)

### Mode: Design Tokens

Extract design tokens for your codebase:

```bash
# CSS custom properties (default)
ralph-starter integrations fetch figma "ABC123" --figma-mode tokens

# SCSS variables
ralph-starter integrations fetch figma "ABC123" --figma-mode tokens --figma-format scss

# JSON
ralph-starter integrations fetch figma "ABC123" --figma-mode tokens --figma-format json

# Tailwind config
ralph-starter integrations fetch figma "ABC123" --figma-mode tokens --figma-format tailwind
```

Extracted tokens:
- **Colors** – From fill styles
- **Typography** – Font family, size, weight, line height
- **Shadows** – Drop shadows and inner shadows
- **Border Radii** – From frames and shapes
- **Spacing** – From auto-layout gaps

### Mode: Component Code

Generate framework-specific component code:

```bash
# React (default)
ralph-starter integrations fetch figma "ABC123" --figma-mode components

# Vue SFC
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework vue

# Svelte
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework svelte

# Astro
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework astro

# Next.js (with 'use client')
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework nextjs

# Nuxt (Vue 3 with CSS modules)
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework nuxt

# HTML + CSS
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework html
```

### Mode: Asset Export

Export icons and images:

```bash
# SVG (default)
ralph-starter integrations fetch figma "ABC123" --figma-mode assets

# PNG at 2x scale
ralph-starter integrations fetch figma "ABC123" --figma-mode assets --figma-format png --figma-scale 2
```

Assets are detected by name patterns: `icon`, `asset`, `logo`, `illustration`.

:::note
Export URLs expire after 30 days. Re-run the fetch to get fresh URLs.
:::

### Mode: Content Extraction

Extract text content from Figma designs and apply it directly to your existing templates:

```bash
# Extract content and apply to existing project
ralph-starter run --from figma --project "ABC123" --figma-mode content

# Preview changes without applying
ralph-starter run --from figma --project "ABC123" --figma-mode content --figma-preview

# Target specific directory
ralph-starter run --from figma --project "ABC123" --figma-mode content --figma-target "src/pages"

# Use custom content mapping
ralph-starter run --from figma --project "ABC123" --figma-mode content --figma-mapping mapping.json
```

Content mode extracts:
- **Text content** – All text layers organized by frame hierarchy
- **Semantic roles** – Headings, body text, buttons, labels
- **Information architecture** – Page structure and navigation patterns
- **Component mapping** – Matches Figma frames to existing project components

#### Content Mapping File

Create a custom mapping file to control how Figma content maps to your components:

```json
{
  "pages": {
    "Home": "src/pages/Home.tsx",
    "About": "src/pages/About.tsx"
  },
  "components": {
    "Hero": {
      "file": "src/components/Hero.tsx",
      "props": {
        "heading": "title",
        "subheading": "subtitle",
        "cta": "buttonText"
      }
    }
  }
}
```

#### Use Cases

- **Update copy** – Change text content without touching code structure
- **Localization prep** – Extract all text for translation
- **Design sync** – Keep your app in sync with design changes
- **Content-first development** – Start with real content from designs

## Options

| Option | Description | Values |
|--------|-------------|--------|
| `--figma-mode` | Operation mode | `spec`, `tokens`, `components`, `assets`, `content` |
| `--figma-format` | Token output format | `css`, `scss`, `json`, `tailwind` |
| `--figma-framework` | Component framework | `react`, `vue`, `svelte`, `astro`, `nextjs`, `nuxt`, `html` |
| `--figma-nodes` | Specific node IDs | Comma-separated (e.g., `1:23,1:45`) |
| `--figma-scale` | Image export scale | Number (default: `1`) |
| `--figma-target` | Target directory (content mode) | Path (e.g., `src/pages`) |
| `--figma-preview` | Preview without applying (content mode) | Flag |
| `--figma-mapping` | Custom mapping file (content mode) | File path (e.g., `mapping.json`) |
| `--model` | AI model for the coding agent | Model ID (e.g., `claude-sonnet-4-5-20250929`) |

## Figma URL Formats

The integration accepts various URL formats:

```bash
# Full file URL
https://www.figma.com/file/ABC123/MyDesign

# Design URL (new format)
https://www.figma.com/design/ABC123/MyDesign

# With node selection
https://www.figma.com/file/ABC123/MyDesign?node-id=1:23

# File key only
ABC123
```

## Example Workflows

### Design-to-Code with AI Loop

```bash
# Use Figma design as task specification
ralph-starter run --from figma \
  --project "https://figma.com/file/ABC123/LoginPage" \
  --preset feature
```

### Generate Theme File

```bash
# Extract tokens and redirect to file
ralph-starter integrations fetch figma "ABC123" \
  --figma-mode tokens \
  --figma-format css > theme.css
```

### Export All Icons

```bash
# Get icon manifest with download script
ralph-starter integrations fetch figma "ABC123" --figma-mode assets

# Run the generated curl commands to download
```

### Choose Your Model

Use `--model` to pick which AI model implements the design. Sonnet is fast and cost-effective for most UI work; Opus produces more nuanced implementations for complex layouts:

```bash
# Fast iteration with Sonnet (recommended for most Figma workflows)
ralph-starter run --from figma \
  --project "https://figma.com/file/ABC123/Dashboard" \
  --figma-mode components \
  --model claude-sonnet-4-5-20250929 \
  --max-iterations 5

# Maximum quality with Opus
ralph-starter run --from figma \
  --project "https://figma.com/file/ABC123/Dashboard" \
  --figma-mode components \
  --model claude-opus-4-6 \
  --max-iterations 3
```

:::tip Model Selection for Figma
**Sonnet** is the sweet spot for Figma-to-code. It handles component structure, layout, and styling accurately at ~5x lower cost and faster iteration speed. Use **Opus** when you need complex state logic or intricate responsive behavior alongside the UI.
:::

## Test Connection

Verify your authentication:

```bash
ralph-starter integrations test figma
```

## Rate Limits & Caching

### Figma API Rate Limits

Figma enforces rate limits based on your **plan tier** and **seat type**. This matters because it determines how many API requests you can make per minute (or per month).

| Seat Type | Starter | Professional | Enterprise |
|-----------|---------|-------------|------------|
| Collab/Viewer (low) | 6/month | 5/min | 10/min |
| Dev/Full (high) | 10/min | 15-50/min | 20-100/min |

:::warning Free & Starter Plans
On the **Starter plan with a Collab/Viewer seat** (`limit-type=low`), you get only **6 requests per month**. Each `ralph-starter run --from figma` uses 2-4 API calls, so you can exhaust your budget in 1-2 runs. Upgrade to a **Professional plan with a Dev seat** ($12/month) for 10+ requests per minute.
:::

### Community Files

When you access a **community file** (duplicated from the Figma Community), the **file owner's plan** determines your rate limits -- not your own plan. If the original author is on a free/starter plan, you'll be limited to 6 requests per month regardless of your plan.

**Fix:** Duplicate the file to your own workspace. This makes you the owner and applies your plan's limits.

### Response Caching

ralph-starter automatically caches Figma API responses in `~/.ralph/figma-cache/` with a 1-hour TTL. This means:

- **First run** fetches from the API and populates the cache
- **Subsequent runs** (within 1 hour) use the cache with zero API calls
- **Rate limited (429)?** Falls back to stale cache if available

This is especially useful for iterative development -- fetch once, then run the coding loop as many times as you want without touching the API.

To clear the cache and force a fresh fetch:

```bash
rm -rf ~/.ralph/figma-cache/
```

### Debugging API Issues

Use the `RALPH_DEBUG` environment variable to see every API request, response status, and rate limit headers:

```bash
RALPH_DEBUG=1 ralph-starter run --from figma --project "your-figma-url"
```

This shows:
- Each API endpoint being called
- HTTP status codes and retry-after values
- Plan tier (`x-figma-plan-tier`) and limit type (`x-figma-rate-limit-type`)
- Cache hits and stale cache fallbacks

## Troubleshooting

### "Figma API blocked for ~N day(s)"

This means CloudFront (Figma's CDN) has blocked your IP after too many rate-limited requests. The `retry-after` header shows days, not minutes.

**Solutions (pick one):**
1. **Upgrade your Figma plan** to Professional with a Dev seat ($12/month) -- gives you 10+ req/min instead of 6/month
2. **Use a VPN** to get a fresh IP, fetch once to populate the cache, then disconnect
3. **Wait** for the block to expire (shown in the error message)

### "Figma API rate limit hit"

A transient rate limit (not a CDN block). ralph-starter will automatically retry once after respecting the `retry-after` header. If it fails again, wait 1-2 minutes and try again.

### "Invalid Figma token"

Your token may have expired or been revoked. Create a new token in Figma settings.

### "Access denied"

Ensure your token has access to the file. For team files, you need to be a member of the team.

### "File not found"

Check the file key or URL is correct. The file key is the 22-character string after `/file/` in the URL.

### No assets found

Assets are detected by name patterns. Rename your icon frames to include "icon", "logo", or "asset" in the name, or specify node IDs directly with `--figma-nodes`.

## Limitations

- **Variables API** requires Figma Enterprise plan (falls back to styles)
- **Image export URLs** expire after 30 days
- **Large files** may be slow; use `--figma-nodes` to target specific frames
- **Starter plan (Collab seat)** limited to 6 API requests/month -- use caching or upgrade to Professional
