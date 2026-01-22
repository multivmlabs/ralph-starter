# Knowledge Harvest Specification

## Overview

Extract learnings from completed Ralph loops and update project documentation automatically. Creates a flywheel where future iterations benefit from past patterns.

## Features

### Harvest Command

```bash
ralph-starter harvest
```

**Behavior:**
1. Scan `activity.md` for patterns and learnings
2. Extract successful patterns from commits
3. Update `AGENTS.md` with operational insights
4. Archive completed tasks from `IMPLEMENTATION_PLAN.md`
5. Optionally update `.claude/CLAUDE.md` with project-specific patterns

### What Gets Harvested

- **Successful patterns**: Code patterns that passed validation
- **Common fixes**: Recurring issues and their solutions
- **Time estimates**: Actual iteration counts for task types
- **Cost data**: Token usage patterns for estimation

### Output

Updates to existing files:
- `AGENTS.md` - New patterns section
- `IMPLEMENTATION_PLAN.md` - Archive completed, note learnings

New file (optional):
- `LEARNINGS.md` - Detailed extraction of patterns

## Acceptance Criteria

- [ ] Extracts patterns from activity.md
- [ ] Updates AGENTS.md with new patterns
- [ ] Archives completed tasks
- [ ] Preserves existing content (append-only)
- [ ] Works without activity.md (graceful fallback)

## Technical Requirements

- Parse markdown activity log
- Identify recurring patterns
- Deduplicate similar learnings
- Respect existing file structure
