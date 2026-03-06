# Linear Ticket Processing Demo
# ralph-starter run --from linear — fetch sprint tickets and implement

Output demos/output/linear-demo.gif
Output demos/output/linear-demo.mp4

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
Type "ralph-starter run --from linear --label sprint-3 --commit"
Sleep 500ms
Enter
Sleep 1s

# Simulate fetching Linear issues
Hide
Type "echo '→ Fetching Linear issues (sprint-3)...'"
Enter
Sleep 100ms
Show
Sleep 1.5s

Hide
Type "echo '  Found 4 issues: RAL-41, RAL-42, RAL-43, RAL-44'"
Enter
Sleep 100ms
Show
Sleep 1s

# Simulate processing
Hide
Type "echo '→ Processing RAL-42: \"Dark mode toggle\"'"
Enter
Sleep 100ms
Show
Sleep 1.5s

Hide
Type "echo '→ Loop 1/8: Implementing theme provider...'"
Enter
Sleep 100ms
Show
Sleep 1.5s

Hide
Type "echo '→ Loop 2/8: Adding CSS variables and toggle...'"
Enter
Sleep 100ms
Show
Sleep 1.5s

# Show validation
Hide
Type "echo '→ Validation passed: build clean, 8 tests passing'"
Enter
Sleep 100ms
Show
Sleep 1.5s

# Show commits
Hide
Type "echo '→ Committed: feat(theme): add dark mode toggle'"
Enter
Type "echo '→ Committed: test(theme): add theme provider tests'"
Enter
Sleep 100ms
Show
Sleep 1.5s

# Success
Hide
Type "echo '✓ Done in 5m 12s | Cost: \$0.52 | 5 commits'"
Enter
Sleep 100ms
Show
Sleep 3s
