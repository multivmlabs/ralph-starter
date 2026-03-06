# Notion Spec-to-Code Demo
# ralph-starter run --from notion — parse Notion page and build

Output demos/output/notion-demo.gif
Output demos/output/notion-demo.mp4

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
Type 'ralph-starter run --from notion --project "REST API Spec" --commit'
Sleep 500ms
Enter
Sleep 1s

# Simulate fetching Notion page
Hide
Type "echo '→ Fetching Notion page: REST API Spec...'"
Enter
Sleep 100ms
Show
Sleep 1.5s

Hide
Type "echo '  Parsed: 3 sections, 12 endpoints'"
Enter
Type "echo '  Requirements: auth middleware, validation, error handling'"
Enter
Sleep 100ms
Show
Sleep 1.5s

# Simulate loop iterations
Hide
Type "echo '→ Loop 1/6: Scaffolding Express routes...'"
Enter
Sleep 100ms
Show
Sleep 1.5s

Hide
Type "echo '→ Loop 2/6: Adding middleware & validation...'"
Enter
Sleep 100ms
Show
Sleep 1.5s

Hide
Type "echo '→ Loop 3/6: Writing integration tests...'"
Enter
Sleep 100ms
Show
Sleep 1.5s

# Show test results
Hide
Type "echo '→ Validation passed: 18 tests, lint clean'"
Enter
Sleep 100ms
Show
Sleep 1.5s

# Show commits
Hide
Type "echo '→ Committed: feat(api): add REST endpoints'"
Enter
Type "echo '→ Committed: test(api): add integration tests'"
Enter
Sleep 100ms
Show
Sleep 1.5s

# Success
Hide
Type "echo '✓ Done in 6m 03s | Cost: \$0.61 | 4 commits'"
Enter
Sleep 100ms
Show
Sleep 3s
