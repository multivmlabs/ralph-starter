# Twitter/X Thread: Spec Driven Development with ralph-starter

## Instructions
- Post as a thread (not a single tweet)
- Each tweet under 280 characters
- Include code screenshots where noted

---

## Tweet 1 (Hook)

Spec Driven Development is eating AI coding.

OpenSpec, Spec-Kit, Kiro -- everyone's building spec frameworks now.

Here's why specs matter more than prompts, and how ralph-starter fits in:

---

## Tweet 2 (The problem)

The #1 mistake with AI coding agents:

"Add authentication to the app"

3 words. Zero context. The agent guesses everything. You spend 5 iterations fixing what a 10-line spec would've nailed in 2.

---

## Tweet 3 (What is SDD)

Spec Driven Development = write a clear spec BEFORE the agent touches code.

Not a 50-page doc. A focused spec:
- What to build (proposal)
- How to build it (design)
- How to verify it (acceptance criteria)

10-20 lines. 3 minutes to write.

---

## Tweet 4 (The landscape)

Three SDD tools gaining traction:

OpenSpec -- lightweight, tool-agnostic, fluid phases
Spec-Kit -- GitHub's heavyweight 5-phase framework
Kiro -- AWS's full IDE with built-in agents

Each has tradeoffs. None connects to your existing workflow.

---

## Tweet 5 (ralph-starter's angle)

ralph-starter takes a different approach:

Your specs already live in GitHub Issues, Linear tickets, Notion docs, Figma files.

Why rewrite them? Pull from where they are, run autonomous loops until done.

```
ralph-starter run --from github --project myorg/repo
ralph-starter run --from openspec:my-feature
```

---

## Tweet 6 (New: OpenSpec + spec-validate)

Just shipped in v0.5.0:

Native OpenSpec support + spec validation.

```
ralph-starter spec validate
ralph-starter run --from openspec:auth --spec-validate
```

Checks for RFC 2119 keywords (SHALL/MUST), acceptance criteria, design sections. Scores 0-100.

Low score = bad spec = wasted tokens.

---

## Tweet 7 (The numbers)

Before specs: 5 loops, $3+, wrong output
After specs: 2 loops, ~$0.50, correct output

The spec IS the leverage. Not the model. Not the prompt engineering. The spec.

---

## Tweet 8 (Multi-agent)

ralph-starter works with any agent:

- Claude Code
- Cursor
- Codex CLI
- OpenCode
- Amp (Sourcegraph)

No lock-in. No IDE requirement. CLI that runs anywhere.

---

## Tweet 9 (CTA)

ralph-starter is open source, MIT licensed.

Pull specs from GitHub/Linear/Notion/Figma/OpenSpec.
Run autonomous coding loops.
Ship faster.

https://github.com/multivmlabs/ralph-starter

Star it if SDD resonates.
