# Session Management Specification

## Overview

Add pause/resume functionality to ralph-starter loops, allowing users to stop a running loop and continue later from where they left off.

## Features

### Pause Command

```bash
ralph-starter pause
```

**Behavior:**
- Saves current loop state to `.ralph-session.json`
- Gracefully stops the current iteration
- Preserves git state and uncommitted changes

### Resume Command

```bash
ralph-starter resume
```

**Behavior:**
- Reads state from `.ralph-session.json`
- Continues from the last completed iteration
- Restores task context and validation state

### Session File Format

```json
{
  "id": "uuid",
  "startedAt": "2026-01-22T10:00:00Z",
  "pausedAt": "2026-01-22T11:30:00Z",
  "task": "Build a todo app",
  "currentIteration": 15,
  "maxIterations": 50,
  "state": "paused",
  "checkpoint": {
    "lastCommit": "abc1234",
    "lastOutput": "...",
    "validationState": []
  },
  "options": {
    "commit": true,
    "validate": true,
    "preset": "feature"
  }
}
```

## Acceptance Criteria

- [ ] `ralph-starter pause` saves session state
- [ ] `ralph-starter resume` continues from checkpoint
- [ ] Session expires after 24 hours
- [ ] Clear error message if no session to resume
- [ ] Works with all existing options (--commit, --validate, etc.)

## Technical Requirements

- Session file: `.ralph-session.json` in project root
- Add to `.gitignore` recommendation
- Handle concurrent session attempts (only one active)
- Clean up session file on successful completion
