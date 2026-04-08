# Figma Wizard Demo
# ralph-starter figma — interactive design-to-code workflow

Output demos/output/figma-demo.gif
Output demos/output/figma-demo.mp4

Require echo

Set Shell "bash"
Set FontSize 18
Set Width 1000
Set Height 700
Set Theme "Catppuccin Mocha"
Set FontFamily "JetBrains Mono"
Set Padding 24
Set TypingSpeed 0

# Run the colored simulation (includes command display)
Hide
Type "clear && bash demos/scripts/figma-sim.sh"
Enter
Sleep 200ms
Show

# Wait for script to finish (script has ~12s of internal sleeps)
Sleep 16s
