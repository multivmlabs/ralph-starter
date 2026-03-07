#!/bin/bash
# Simulates ralph-starter run --from github output with real CLI styling
C='\033[36m'   # Cyan
G='\033[32m'   # Green
Y='\033[33m'   # Yellow
B='\033[1m'    # Bold
D='\033[2m'    # Dim
R='\033[0m'    # Reset

# Show the command that was "run"
echo -e "${D}\$${R} ralph-starter run --from github --project acme/webapp --issue 42 --commit"
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
echo -e "${C}→${R} Fetching GitHub issue ${B}#42${R}..."
sleep 0.8
echo -e "  Found: ${B}Add user authentication${R}"
echo -e "  Labels: ${C}feature${R}, ${C}auth${R}"
echo -e "  ${D}3 linked files loaded${R}"
sleep 1

# Loop iteration 1
echo ""
echo -e "${C}┌─────────────────────────────────────────────────┐${R}"
echo -e "${C}│${R}   acme/webapp#42 │ Iter 1/5 │ \$0.00           ${C}│${R}"
echo -e "${C}└─────────────────────────────────────────────────┘${R}"
echo -e "  ${C}◐${R} Analyzing requirements..."
sleep 1.2
echo -e "  ${G}✓${R} Iteration 1 complete (19s) ~\$0.12"

# Loop iteration 2
echo ""
echo -e "${C}→${R} Loop 2/5: Generating auth module..."
sleep 1.2
echo -e "  ${G}✓${R} Iteration 2 complete (31s) ~\$0.14"

# Loop iteration 3
echo ""
echo -e "${C}→${R} Loop 3/5: Adding tests and validation..."
sleep 1.2
echo -e "  ${G}✓${R} Iteration 3 complete (18s) ~\$0.08"

# Validation
echo ""
echo -e "${C}→${R} Validation passed: ${G}12 tests${R}, lint clean ${G}✓${R}"
sleep 0.8

# PR
echo -e "${C}→${R} Creating pull request..."
sleep 0.8
echo -e "  ${G}✓${R} PR ${B}#87${R} created"

# Done
echo ""
echo -e "${G}✓ Done in 4m 18s${R} | Cost: \$0.38 | PR #87 created"
sleep 2
