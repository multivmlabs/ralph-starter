#!/bin/bash
# Generate branded blog post images (1200x630 for og:image)
# Composites Ralph character illustrations onto dark branded backgrounds
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="${SCRIPT_DIR}/../static/img/blog"
IMG_DIR="${SCRIPT_DIR}/../static/img"
RALPH_DIR="${IMG_DIR}/ralph"
mkdir -p "$OUT_DIR"

generate_image() {
  local filename="$1"
  local title="$2"
  local subtitle="$3"
  local ralph_img="$4"  # Path to Ralph character image

  # Step 1: Create dark background with grid and accent bar using SVG
  cat > "/tmp/blog-bg-${filename}.svg" << SVGEOF
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
  <rect x="0" y="0" width="1200" height="4" fill="url(#accent)"/>
  <g opacity="0.03">
    $(for i in $(seq 0 40 1200); do echo "<line x1='$i' y1='0' x2='$i' y2='630' stroke='white' stroke-width='1'/>"; done)
    $(for i in $(seq 0 40 630); do echo "<line x1='0' y1='$i' x2='1200' y2='$i' stroke='white' stroke-width='1'/>"; done)
  </g>
</svg>
SVGEOF

  # Step 2: Convert background SVG to PNG
  rsvg-convert -w 1200 -h 630 "/tmp/blog-bg-${filename}.svg" -o "/tmp/blog-bg-${filename}.png"

  # Step 3: Composite Ralph character on the right side (300px height, positioned at right)
  # First resize Ralph to fit, then composite onto background
  magick "/tmp/blog-bg-${filename}.png" \
    \( "$ralph_img" -resize x350 -background none -gravity center \) \
    -gravity east -geometry +60+20 -composite \
    "/tmp/blog-composed-${filename}.png"

  # Step 4: Add text overlay (title, subtitle, brand)
  local line1 line2
  line1=$(echo "$title" | fold -w 28 -s | head -1)
  line2=$(echo "$title" | fold -w 28 -s | sed -n '2p')

  magick "/tmp/blog-composed-${filename}.png" \
    -font "Helvetica-Bold" -pointsize 52 -fill white \
    -gravity northwest -annotate +80+180 "$line1" \
    ${line2:+-font "Helvetica-Bold" -pointsize 52 -fill white -gravity northwest -annotate +80+250 "$line2"} \
    -font "Helvetica" -pointsize 24 -fill '#999999' \
    -gravity northwest -annotate +80+$([ -n "$line2" ] && echo "320" || echo "260") "$subtitle" \
    -font "Helvetica-Bold" -pointsize 22 -fill '#f59e0b' \
    -gravity southwest -annotate +80+60 "ralph-starter" \
    -font "Helvetica" -pointsize 18 -fill '#666666' \
    -gravity southwest -annotate +280+62 "ralphstarter.ai/blog" \
    "${OUT_DIR}/${filename}.png"

  echo "  Generated ${filename}.png"
}

echo "Generating blog images with Ralph characters..."

generate_image "why-i-built-ralph-starter" \
  "Why I Built ralph-starter" \
  "The story behind autonomous AI coding loops" \
  "${IMG_DIR}/coder.png"

generate_image "first-ralph-loop" \
  "My First Ralph Loop" \
  "What happens when AI codes on repeat" \
  "${IMG_DIR}/engineer.png"

generate_image "claude-code-setup" \
  "ralph-starter + Claude Code" \
  "The full setup guide" \
  "${IMG_DIR}/coder.png"

generate_image "figma-to-code" \
  "Figma to Code in One Command" \
  "Design specs to production components" \
  "${RALPH_DIR}/scientist.png"

generate_image "auto-mode-github" \
  "10 GitHub Issues Went to Lunch" \
  "Auto mode batch processing in action" \
  "${RALPH_DIR}/astronaut-fly.png"

generate_image "linear-workflow" \
  "ralph-starter with Linear" \
  "From Linear tickets to shipped code" \
  "${IMG_DIR}/engineer.png"

generate_image "cost-tracking" \
  "Prompt Caching Saved Me \$47" \
  "Real cost breakdown of AI coding loops" \
  "${RALPH_DIR}/ralphwiggum.png"

generate_image "specs-new-code" \
  "Specs Are the New Code" \
  "Why writing specs beats writing code" \
  "${RALPH_DIR}/scientist.png"

generate_image "ralph-wiggum-technique" \
  "The Ralph Wiggum Technique" \
  "Dumb loops, smart results" \
  "${RALPH_DIR}/ralphwiggum.png"

generate_image "ai-agents-comparison" \
  "Five AI Coding Agents Compared" \
  "Claude Code, Cursor, Codex, OpenCode and more" \
  "${RALPH_DIR}/scientist.png"

generate_image "vs-manual" \
  "ralph-starter vs Manual" \
  "One week, 12 tasks, real numbers" \
  "${IMG_DIR}/engineer.png"

echo "Done! Generated 11 blog images in ${OUT_DIR}"
