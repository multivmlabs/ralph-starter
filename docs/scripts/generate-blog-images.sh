#!/bin/bash
# Generate branded blog post images (1200x630 for og:image)
set -e

OUT_DIR="$(dirname "$0")/../static/img/blog"
mkdir -p "$OUT_DIR"

generate_image() {
  local filename="$1"
  local title="$2"
  local subtitle="$3"
  local emoji="$4"

  # Create SVG with dark branded style
  cat > "/tmp/blog-${filename}.svg" << SVGEOF
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0a"/>
      <stop offset="50%" style="stop-color:#111111"/>
      <stop offset="100%" style="stop-color:#0a0a0a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f59e0b"/>
      <stop offset="100%" style="stop-color:#f97316"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <!-- Top accent bar -->
  <rect x="0" y="0" width="1200" height="4" fill="url(#accent)"/>
  <!-- Grid pattern -->
  <g opacity="0.03">
    $(for i in $(seq 0 40 1200); do echo "<line x1='$i' y1='0' x2='$i' y2='630' stroke='white' stroke-width='1'/>"; done)
    $(for i in $(seq 0 40 630); do echo "<line x1='0' y1='$i' x2='1200' y2='$i' stroke='white' stroke-width='1'/>"; done)
  </g>
  <!-- Emoji -->
  <text x="80" y="200" font-size="80" font-family="Apple Color Emoji, Segoe UI Emoji">${emoji}</text>
  <!-- Title -->
  <text x="80" y="340" font-size="48" font-weight="bold" fill="white" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">
    $(echo "$title" | fold -w 35 -s | head -1)
  </text>
  <text x="80" y="400" font-size="48" font-weight="bold" fill="white" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">
    $(echo "$title" | fold -w 35 -s | sed -n '2p')
  </text>
  <!-- Subtitle -->
  <text x="80" y="470" font-size="24" fill="#999999" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">${subtitle}</text>
  <!-- Brand -->
  <text x="80" y="570" font-size="22" font-weight="bold" fill="#f59e0b" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">ralph-starter</text>
  <text x="280" y="570" font-size="18" fill="#666666" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">ralphstarter.ai/blog</text>
</svg>
SVGEOF

  rsvg-convert -w 1200 -h 630 "/tmp/blog-${filename}.svg" -o "${OUT_DIR}/${filename}.png"
  echo "  Generated ${filename}.png"
}

echo "Generating blog images..."

generate_image "why-i-built-ralph-starter" \
  "Why I Built ralph-starter" \
  "The story behind autonomous AI coding loops" \
  "🔨"

generate_image "first-ralph-loop" \
  "My First Ralph Loop" \
  "What happens when AI codes on repeat" \
  "🔄"

generate_image "claude-code-setup" \
  "ralph-starter + Claude Code Setup" \
  "Step-by-step integration guide" \
  "⚡"

generate_image "figma-to-code" \
  "Figma to Code in One Command" \
  "Design specs to production components" \
  "🎨"

generate_image "auto-mode-github" \
  "10 GitHub Issues Went to Lunch" \
  "Auto mode batch processing in action" \
  "🤖"

generate_image "linear-workflow" \
  "ralph-starter with Linear" \
  "From Linear tickets to shipped code" \
  "📋"

generate_image "cost-tracking" \
  "Prompt Caching Saved Me $47" \
  "Real cost breakdown of AI coding loops" \
  "💰"

generate_image "specs-new-code" \
  "Specs Are the New Code" \
  "Why writing specs beats writing code" \
  "📝"

generate_image "ralph-wiggum-technique" \
  "The Ralph Wiggum Technique" \
  "Dumb loops, smart results" \
  "🧠"

generate_image "ai-agents-comparison" \
  "Five AI Coding Agents Compared" \
  "Claude Code, Cursor, Codex, OpenCode and more" \
  "⚔️"

generate_image "vs-manual" \
  "ralph-starter vs Manual Workflow" \
  "One week, 12 tasks, real numbers" \
  "📊"

echo "Done! Generated 11 blog images in ${OUT_DIR}"
