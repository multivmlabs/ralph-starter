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

generate_image_with_logo() {
  local filename="$1"
  local title="$2"
  local subtitle="$3"
  local ralph_img="$4"
  local logo_img="$5"  # Path to logo (SVG or PNG/JPEG)

  # Generate base image first
  generate_image "$filename" "$title" "$subtitle" "$ralph_img"

  # Convert logo to PNG if SVG
  local logo_png="/tmp/blog-logo-${filename}.png"
  if [[ "$logo_img" == *.svg ]]; then
    rsvg-convert -h 70 "$logo_img" -o "$logo_png"
  else
    magick "$logo_img" -resize x70 -background none "$logo_png"
  fi

  # Composite logo onto the generated image at top-left
  magick "${OUT_DIR}/${filename}.png" \
    \( "$logo_png" -background none \) \
    -gravity northwest -geometry +80+80 -composite \
    "${OUT_DIR}/${filename}.png"

  echo "  Added logo to ${filename}.png"
}

echo "Generating blog images with Ralph characters..."

# Titles and subtitles must match the blog post frontmatter (title + description)

generate_image "why-autonomous-coding" \
  "Why autonomous AI coding loops work" \
  "The loop itself was the problem, not the AI" \
  "${IMG_DIR}/coder.png"

generate_image "why-i-built-ralph-starter" \
  "Why I built ralph-starter" \
  "I was copy-pasting between ChatGPT and my editor" \
  "${IMG_DIR}/coder.png"

generate_image "first-ralph-loop" \
  "My first ralph loop" \
  "What actually happens from start to PR" \
  "${IMG_DIR}/engineer.png"

generate_image "validation-driven-dev" \
  "Let your tests guide the AI" \
  "Tests in the loop catch and fix mistakes" \
  "${RALPH_DIR}/scientist.png"

generate_image "claude-code-setup" \
  "ralph-starter + Claude Code" \
  "Zero to your first automated PR" \
  "${IMG_DIR}/coder.png"

generate_image_with_logo "figma-to-code" \
  "Figma to code in one command" \
  "12-screen dashboard, 87 cents total" \
  "${RALPH_DIR}/scientist.png" \
  "${IMG_DIR}/figma-logo.svg"

generate_image "auto-mode-github" \
  "Automating entire workflows" \
  "From specs to PRs on autopilot" \
  "${RALPH_DIR}/astronaut-fly.png"

generate_image_with_logo "linear-workflow" \
  "Ship Linear tasks with AI" \
  "My daily workflow from tickets to PRs" \
  "${IMG_DIR}/engineer.png" \
  "${IMG_DIR}/linear.jpeg"

generate_image "connect-your-tools" \
  "From spec to code in one command" \
  "Pulls specs from GitHub, Linear, Notion" \
  "${IMG_DIR}/coder.png"

generate_image "cost-tracking" \
  "Prompt caching saved me \$47" \
  "90% off input tokens after the first loop" \
  "${RALPH_DIR}/ralphwiggum.png"

generate_image "specs-new-code" \
  "Specs are the new code" \
  "A clear spec gets you a working PR in 2 loops" \
  "${RALPH_DIR}/scientist.png"

generate_image "ralph-wiggum-technique" \
  "The Ralph Wiggum technique" \
  "AI coding agents in loops until done" \
  "${RALPH_DIR}/ralphwiggum.png"

generate_image "ai-agents-comparison" \
  "5 AI coding agents compared" \
  "Claude Code, Cursor, Codex, OpenCode and more" \
  "${RALPH_DIR}/scientist.png"

generate_image "vs-manual" \
  "ralph-starter vs manual" \
  "6 tasks manual, 6 with ralph-starter" \
  "${IMG_DIR}/engineer.png"

echo "Done! Generated 14 blog images in ${OUT_DIR}"
