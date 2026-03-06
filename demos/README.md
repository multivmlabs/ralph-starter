# Terminal Demos

Terminal demo recordings generated with [VHS](https://github.com/charmbracelet/vhs) by Charm.

## Prerequisites

1. **Install VHS**:

```bash
# macOS
brew install charmbracelet/tap/vhs

# or with Go
go install github.com/charmbracelet/vhs@latest
```

VHS also requires [ffmpeg](https://ffmpeg.org/) and [ttyd](https://github.com/tsl0922/ttyd):

```bash
brew install ffmpeg ttyd
```

2. **Install ralph-starter** (tapes use `Require ralph-starter`):

```bash
npm install -g ralph-starter
# or build locally: pnpm build && npm link
```

## Generate demos

```bash
# Generate a single demo
vhs demos/figma.tape

# Generate all demos
for tape in demos/*.tape; do vhs "$tape"; done
```

## Output

Generated files go to `demos/output/` (gitignored except for `.gitkeep`).

Each tape produces:
- `.gif` — for embedding in blog posts, README, landing page, and social media
- `.mp4` — for website embedding and higher quality sharing

## Tapes

| Tape | Description |
|------|-------------|
| `figma.tape` | Figma wizard: paste URL → select stack → visual validation → done |
| `github.tape` | GitHub issue to code: fetch issue → AI loop → PR created |
| `linear.tape` | Linear tickets: fetch sprint → implement → commits |
| `notion.tape` | Notion spec to code: parse pages → scaffold → tests |

## Embedding

GIFs are referenced from:
- **README.md** — project root, shows the Figma demo
- **Landing page** — `docs/src/components/HeroSection/` can optionally embed a demo
- **Blog posts** — inline with `![Demo](../demos/output/figma-demo.gif)`
- **Social media** — attach GIFs directly to tweets/LinkedIn posts
