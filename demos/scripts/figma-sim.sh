#!/bin/bash
# Simulates ralph-starter figma wizard output with real CLI styling
C='\033[36m'   # Cyan
G='\033[32m'   # Green
Y='\033[33m'   # Yellow
B='\033[1m'    # Bold
D='\033[2m'    # Dim
R='\033[0m'    # Reset

# Show the command that was "run"
echo -e "${D}\$${R} ralph-starter figma"
sleep 0.3

# Banner
echo ""
echo -e "${C}┌──────────────────────────────────────────────────┐${R}"
echo -e "${C}│${R}  ${B}ralph-starter${R} ${D}v0.4.0${R}                          ${C}│${R}"
echo -e "${C}│${R}  ${D}AI-powered project generator${R}                   ${C}│${R}"
echo -e "${C}└──────────────────────────────────────────────────┘${R}"
echo ""
sleep 0.5

# Wizard title
echo -e "  ${C}${B}Figma to Code${R}"
echo -e "  ${D}Design to code in one command${R}"
echo ""
sleep 0.8

# Step 1: URL
echo -e "${G}?${R} Figma design URL:"
echo -e "  ${D}(paste the full Figma file or frame URL)${R}"
sleep 0.4
echo -e "  ${C}>${R} https://figma.com/design/ABC123/MNTN-Landing-Page"
sleep 0.8

# Step 2: Description
echo ""
echo -e "${G}?${R} What would you like to build?"
sleep 0.4
echo -e "  ${C}>${R} responsive landing page with hero parallax and animated sections"
sleep 0.8

# Step 3: Stack
echo ""
echo -e "${G}?${R} Tech stack? ${B}Next.js + TypeScript + Tailwind CSS${R} ${D}(Detected)${R}"
sleep 0.8

# Step 4: Model
echo ""
echo -e "  ${B}Which model?${R}"
echo ""
echo -e "  ${D}1)${R} Claude Opus 4.6 — maximum quality ${G}(Recommended)${R}"
echo -e "  ${D}2)${R} Claude Sonnet 4.5 — fast + cost-effective"
echo -e "  ${D}3)${R} Custom model ID"
echo ""
echo -e "${G}?${R} Select model: ${C}1${R}"
sleep 0.4
echo -e "  ${D}Using:${R} Claude Opus 4.6 — maximum quality"
echo ""
sleep 0.8

# Fetching
echo -e "${C}→${R} Fetching from Figma API... ${B}8 frames, 21 components${R}"
sleep 1.2

# Loop iteration 1
echo ""
echo -e "${C}┌─────────────────────────────────────────────────┐${R}"
echo -e "${C}│${R}  ◆ Figma │ Iter 1/10 │ \$0.00                   ${C}│${R}"
echo -e "${C}└─────────────────────────────────────────────────┘${R}"
echo -e "  ${C}◐${R} Generating components..."
sleep 1.2
echo -e "  ${G}✓${R} Iteration 1 complete (23s) ~\$0.31"

# Loop iteration 2
echo ""
echo -e "${C}→${R} Loop 2/10: Running visual validation..."
echo -e "  Pixel diff: ${Y}4.2%${R} — analyzing with LLM vision..."
sleep 1.2
echo -e "  ${G}✓${R} Iteration 2 complete (18s) ~\$0.28"

# Loop iteration 3
echo ""
echo -e "${C}→${R} Loop 3/10: Fixing spacing and font issues..."
echo -e "  Pixel diff: ${G}0.9%${R} — strict check passed ${G}✓${R}"
sleep 1.2
echo -e "  ${G}✓${R} Iteration 3 complete (14s) ~\$0.35"

# Done
echo ""
echo -e "${G}✓ Done in 3m 42s${R} | Cost: \$0.94 | 3 commits"
sleep 2
