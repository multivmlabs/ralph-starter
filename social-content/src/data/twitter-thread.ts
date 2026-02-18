export interface Tweet {
  slide: number;
  headline: string;
  body: string;
  stat?: string;
}

export const tweets: Tweet[] = [
  {
    slide: 1,
    headline: 'ralph-starter',
    body: 'I pointed ralph-starter at 10 GitHub issues and went to lunch.',
    stat: '8 PRs · $1.84 total',
  },
  {
    slide: 2,
    headline: 'What is it?',
    body: 'A CLI that runs AI coding agents in a loop.\n\nSpec → agent → test/lint/build → if fail, feed error back → repeat.\n\nWhen everything passes: commit, push, PR.',
  },
  {
    slide: 3,
    headline: 'The problem',
    body: 'I was copy-pasting between my terminal and AI chat 20 times a day.\n\nRead ticket, paste to AI, get code, paste back, run tests, paste error back.\n\nI felt like a human clipboard.',
  },
  {
    slide: 4,
    headline: 'The loop',
    body: '1. Fetch spec (GitHub/Linear/Notion)\n2. Run agent\n3. Validate (test, lint, build)\n4. If fail → feed error → go to 2\n5. If pass → commit, push, PR',
  },
  {
    slide: 5,
    headline: 'Real numbers',
    body: '187 tasks in January\n$22.41 total\n$0.12 per task average',
    stat: '90% cache savings',
  },
  {
    slide: 6,
    headline: 'Batch mode',
    body: 'ralph-starter auto --source github\n  --label "auto-ready" --limit 10\n\nEach issue gets its own branch, its own loop, its own PR.',
  },
  {
    slide: 7,
    headline: '8+ agents',
    body: 'Claude Code · Cursor · Codex CLI · OpenCode · Gemini CLI · Copilot · Amp · Openclaw\n\nAuto-detects what you have installed.',
  },
  {
    slide: 8,
    headline: 'The technique',
    body: 'Named after the Ralph Wiggum technique by Geoffrey Huntley.\n\nGive the AI a task and let it keep going until done.\n\nNo micro-managing.',
  },
  {
    slide: 9,
    headline: 'Try it',
    body: 'npx ralph-starter init\n\nOpen source · MIT licensed',
    stat: 'github.com/multivmlabs/ralph-starter',
  },
];
