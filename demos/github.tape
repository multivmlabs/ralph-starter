# GitHub Issue-to-Code Demo
# ralph-starter run --from github — fetch issue and build autonomously

Output demos/output/github-demo.gif
Output demos/output/github-demo.mp4

Require echo

Set Shell "bash"
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set FontFamily "JetBrains Mono"
Set Padding 24
Set TypingSpeed 40ms

# Show the command
Type "ralph-starter run --from github --project acme/webapp --issue 42 --commit"
Sleep 500ms
Enter
Sleep 2s

# Simulate fetching
Sleep 1s

# Simulate loop iterations
Sleep 2s

# Show validation passing
Sleep 2s

# Show PR creation
Sleep 2s

# Show completion
Sleep 4s
