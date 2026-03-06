# GitHub Issue-to-Code Demo
# ralph-starter run --from github — fetch issue and build autonomously

Output demos/output/github-demo.gif
Output demos/output/github-demo.mp4

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
Type "ralph-starter run --from github --project acme/webapp --issue 42 --commit"
Sleep 500ms
Enter
Sleep 1s

# Simulate fetching
Hide
Type "echo '→ Fetching GitHub issue #42...'"
Enter
Sleep 100ms
Show
Sleep 1.5s

Hide
Type "echo '  Found: Add user authentication'"
Enter
Type "echo '  Labels: feature, auth'"
Enter
Type "echo '  3 linked files loaded'"
Enter
Sleep 100ms
Show
Sleep 1.5s

# Simulate loop iterations
Hide
Type "echo '→ Loop 1/5: Analyzing requirements...'"
Enter
Sleep 100ms
Show
Sleep 1.5s

Hide
Type "echo '→ Loop 2/5: Generating auth module...'"
Enter
Sleep 100ms
Show
Sleep 1.5s

Hide
Type "echo '→ Loop 3/5: Adding tests and validation...'"
Enter
Sleep 100ms
Show
Sleep 1.5s

# Show validation passing
Hide
Type "echo '→ Validation passed: 12 tests, lint clean'"
Enter
Sleep 100ms
Show
Sleep 1.5s

# Show PR creation
Hide
Type "echo '→ Creating pull request...'"
Enter
Sleep 100ms
Show
Sleep 1s

# Success
Hide
Type "echo '✓ Done in 4m 18s | Cost: \$0.38 | PR #87 created'"
Enter
Sleep 100ms
Show
Sleep 3s
