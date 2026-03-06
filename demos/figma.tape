# Figma Wizard Demo
# ralph-starter figma — interactive design-to-code workflow

Output demos/output/figma-demo.gif
Output demos/output/figma-demo.mp4

Require echo
Require ralph-starter

Set Shell "bash"
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set FontFamily "JetBrains Mono"
Set Padding 24
Set TypingSpeed 40ms

# Show the command
Type "ralph-starter figma"
Sleep 500ms
Enter
Sleep 1s

# Simulate wizard header
Hide
Type "echo ''"
Enter
Type "echo '  Figma to Code'"
Enter
Type "echo '  Design to code in one command'"
Enter
Type "echo ''"
Enter
Sleep 200ms
Show
Sleep 1s

# Step 1: Figma URL
Hide
Type "echo '? Figma design URL:'"
Enter
Sleep 100ms
Show
Sleep 500ms
Type "https://figma.com/design/ABC123/MNTN-Landing-Page"
Sleep 300ms
Enter
Sleep 800ms

# Step 2: What to build
Hide
Type "echo '? What would you like to build?'"
Enter
Sleep 100ms
Show
Sleep 500ms
Type "responsive landing page with hero parallax and animated sections"
Sleep 300ms
Enter
Sleep 800ms

# Step 3: Tech stack (auto-detected)
Hide
Type "echo '? Tech stack? Next.js + TypeScript + Tailwind CSS (Detected)'"
Enter
Sleep 100ms
Show
Sleep 1s

# Step 4: Model selection
Hide
Type "echo ''"
Enter
Type "echo '  Which model?'"
Enter
Type "echo '  1) Claude Opus 4.6 — maximum quality (Recommended)'"
Enter
Type "echo '  2) Claude Sonnet 4.5 — fast + cost-effective'"
Enter
Type "echo '  3) Custom model ID'"
Enter
Type "echo '? Select model (number):'"
Enter
Sleep 100ms
Show
Sleep 500ms
Type "1"
Sleep 200ms
Enter
Sleep 500ms

# Show model confirmation
Hide
Type "echo '  Using: Claude Opus 4.6 — maximum quality (Recommended)'"
Enter
Type "echo ''"
Enter
Sleep 100ms
Show
Sleep 1s

# Simulate loop output
Hide
Type "echo '→ Fetching from Figma API... 8 frames, 21 components'"
Enter
Sleep 100ms
Show
Sleep 1.5s

Hide
Type "echo '→ Loop 1/10: Generating components...'"
Enter
Sleep 100ms
Show
Sleep 1.5s

Hide
Type "echo '→ Loop 2/10: Running visual validation...'"
Enter
Type "echo '  Pixel diff: 4.2% — analyzing with LLM vision...'"
Enter
Sleep 100ms
Show
Sleep 1.5s

Hide
Type "echo '→ Loop 3/10: Fixing spacing and font issues...'"
Enter
Type "echo '  Pixel diff: 0.9% — strict check passed'"
Enter
Sleep 100ms
Show
Sleep 1.5s

# Success
Hide
Type "echo '✓ Done in 3m 42s | Cost: \$0.94 | 3 commits'"
Enter
Sleep 100ms
Show
Sleep 3s
