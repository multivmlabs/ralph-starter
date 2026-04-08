#!/bin/bash
# Simulates ralph-starter run --from linear output with real CLI styling
C='\033[36m'   # Cyan
G='\033[32m'   # Green
Y='\033[33m'   # Yellow
B='\033[1m'    # Bold
D='\033[2m'    # Dim
R='\033[0m'    # Reset

# Show the command that was "run"
echo -e "${D}\$${R} ralph-starter run --from linear --label sprint-3 --commit"
sleep 0.3

# Banner
echo ""
echo -e "${C}┌──────────────────────────────────────────────────┐${R}"
echo -e "${C}│${R}  ${B}ralph-starter${R} ${D}v0.4.0${R}                          ${C}│${R}"
echo -e "${C}│${R}  ${D}AI-powered project generator${R}                   ${C}│${R}"
echo -e "${C}└──────────────────────────────────────────────────┘${R}"
echo ""
sleep 0.5

# Fetching
echo -e "${C}→${R} Fetching Linear issues ${D}(sprint-3)${R}..."
sleep 0.8
echo -e "  Found ${B}4 issues${R}: RAL-41, RAL-42, RAL-43, RAL-44"
sleep 0.8

# Processing first issue
echo ""
echo -e "${C}→${R} Processing ${B}RAL-42${R}: Dark mode toggle"
sleep 0.6

# Loop iteration 1
echo ""
echo -e "${C}┌─────────────────────────────────────────────────┐${R}"
echo -e "${C}│${R}  ◫ RAL-42 │ Iter 1/8 │ \$0.00                  ${C}│${R}"
echo -e "${C}└─────────────────────────────────────────────────┘${R}"
echo -e "  ${C}◐${R} Implementing theme provider..."
sleep 1.2
echo -e "  ${G}✓${R} Iteration 1 complete (26s) ~\$0.18"

# Loop iteration 2
echo ""
echo -e "${C}→${R} Loop 2/8: Adding CSS variables and toggle..."
sleep 1.2
echo -e "  ${G}✓${R} Iteration 2 complete (22s) ~\$0.14"

# Validation
echo ""
echo -e "${C}→${R} Validation passed: ${G}build clean${R}, ${G}8 tests passing${R} ${G}✓${R}"
sleep 0.8

# Commits
echo -e "${C}→${R} Committed: ${D}feat(theme): add dark mode toggle${R}"
echo -e "${C}→${R} Committed: ${D}test(theme): add theme provider tests${R}"
sleep 0.8

# Done
echo ""
echo -e "${G}✓ Done in 5m 12s${R} | Cost: \$0.52 | 5 commits"
sleep 2
