# GitHub Issue-to-Code Demo
# ralph-starter run --from github — fetch issue and build autonomously

Output demos/output/github-demo.gif
Output demos/output/github-demo.mp4

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
Type "clear && bash demos/scripts/github-sim.sh"
Enter
Sleep 200ms
Show

# Wait for script to finish (script has ~11s of internal sleeps)
Sleep 14s
