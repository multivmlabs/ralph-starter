#!/bin/bash
# Simulates ralph-starter run --from notion output with real CLI styling
C='\033[36m'   # Cyan
G='\033[32m'   # Green
Y='\033[33m'   # Yellow
B='\033[1m'    # Bold
D='\033[2m'    # Dim
R='\033[0m'    # Reset

# Show the command that was "run"
echo -e "${D}\$${R} ralph-starter run --from notion --project \"REST API Spec\" --commit"
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
echo -e "${C}→${R} Fetching Notion page: ${B}REST API Spec${R}..."
sleep 0.8
echo -e "  Parsed: ${B}3 sections${R}, ${B}12 endpoints${R}"
echo -e "  Requirements: ${D}auth middleware, validation, error handling${R}"
sleep 1

# Loop iteration 1
echo ""
echo -e "${C}┌─────────────────────────────────────────────────┐${R}"
echo -e "${C}│${R}  ▤ Notion │ Iter 1/6 │ \$0.00                   ${C}│${R}"
echo -e "${C}└─────────────────────────────────────────────────┘${R}"
echo -e "  ${C}◐${R} Scaffolding Express routes..."
sleep 1.2
echo -e "  ${G}✓${R} Iteration 1 complete (34s) ~\$0.22"

# Loop iteration 2
echo ""
echo -e "${C}→${R} Loop 2/6: Adding middleware & validation..."
sleep 1.2
echo -e "  ${G}✓${R} Iteration 2 complete (28s) ~\$0.18"

# Loop iteration 3
echo ""
echo -e "${C}→${R} Loop 3/6: Writing integration tests..."
sleep 1.2
echo -e "  ${G}✓${R} Iteration 3 complete (21s) ~\$0.12"

# Validation
echo ""
echo -e "${C}→${R} Validation passed: ${G}18 tests${R}, lint clean ${G}✓${R}"
sleep 0.8

# Commits
echo -e "${C}→${R} Committed: ${D}feat(api): add REST endpoints${R}"
echo -e "${C}→${R} Committed: ${D}test(api): add integration tests${R}"
sleep 0.8

# Done
echo ""
echo -e "${G}✓ Done in 6m 03s${R} | Cost: \$0.61 | 4 commits"
sleep 2
