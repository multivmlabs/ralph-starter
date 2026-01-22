# Implementation Plan

> ralph-starter development roadmap. Update as tasks complete.

## Completed

### Phase 1: Core Loop Improvements
- [x] Circuit breaker pattern (`src/loop/circuit-breaker.ts`)
- [x] Completion promise support (`--completion-promise`)
- [x] Max iterations with warnings at 80%/90%
- [x] Progress tracking to `activity.md` (`src/loop/progress.ts`)

### Phase 2: Exit Detection
- [x] Semantic response analyzer (`src/loop/semantic-analyzer.ts`)
- [x] File-based completion signals (RALPH_COMPLETE, .ralph-done)
- [x] Dual-condition completion check
- [x] EXIT_SIGNAL support (`--require-exit-signal`)

### Phase 3: Workflow Enhancements
- [x] 16 workflow presets (`src/presets/index.ts`)
- [x] Preset CLI option (`--preset`)

### Phase 4: Rate Limiting & Cost Control
- [x] Rate limiter (`src/loop/rate-limiter.ts`)
- [x] Cost tracker (`src/loop/cost-tracker.ts`)
- [x] Per-iteration cost display
- [x] Cost summary and projections

### Documentation
- [x] README.md Table of Contents
- [x] Cost tracking documentation
- [x] Safety controls documentation
- [x] Ralph Playbook files for self-development

---

## In Progress

### Phase 5: Session Management
- [ ] Create `src/loop/session.ts` for pause/resume support
- [ ] Add `ralph-starter pause` command
- [ ] Add `ralph-starter resume` command
- [ ] Store session state in `.ralph-session.json`

---

## Planned

### Phase 6: 5-Phase Spec Generation
- [ ] Create `src/commands/spec.ts`
- [ ] Implement research phase (feasibility analysis)
- [ ] Implement requirements phase (user stories)
- [ ] Implement design phase (architecture)
- [ ] Implement tasks phase (breakdown)

### Phase 7: Knowledge Harvest
- [ ] Create `src/commands/harvest.ts`
- [ ] Extract learnings from `activity.md`
- [ ] Update AGENTS.md with patterns
- [ ] Archive completed tasks

### Phase 8: Enhanced Integrations
- [ ] Playwright MCP integration for visual verification
- [ ] LLM-as-judge tests for subjective criteria
- [ ] Multi-backend support (Gemini CLI, Amp, Copilot CLI)

### Phase 9: Developer Experience
- [ ] Add `--dry-run` flag to preview without executing
- [ ] Add `ralph-starter status` command
- [ ] Add `ralph-starter logs` command for activity.md viewer
- [ ] Improve error messages with suggestions

---

## Notes

- All features should maintain backwards compatibility
- Run `npm run build` after every change
- Update README.md for user-facing features
- Cost tracker uses estimated tokens (~4 chars/token)
