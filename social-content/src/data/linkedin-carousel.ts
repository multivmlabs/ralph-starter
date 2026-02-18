export interface CarouselSlide {
  headline: string;
  body: string;
  stat?: string;
}

export const slides: CarouselSlide[] = [
  {
    headline: 'Automating entire workflows\nwith ralph-starter',
    body: 'CLI that turns tickets into tested PRs.',
  },
  {
    headline: 'I was a human clipboard',
    body: 'Read ticket. Paste to AI. Get code.\nPaste back. Run tests. Paste error.\nRepeat.\n\n12 steps. 5-8 times a day.',
  },
  {
    headline: 'One command. Full loop.',
    body: 'Spec → AI agent → test/lint/build →\nfeed errors back → repeat until done →\ncommit, push, PR.\n\nI stopped being the relay.',
  },
  {
    headline: 'The loop',
    body: '1. Fetch spec (GitHub, Linear, Notion, Figma)\n2. Create branch\n3. Run agent\n4. Validate (test, lint, build)\n5. If fail: feed error, go to 3\n6. If pass: commit, push, PR',
  },
  {
    headline: '$0.12 per task',
    body: '187 tasks in January\n$22.41 total\n\nPrompt caching = 90% savings\nafter first loop',
    stat: '$22.41 / 187 tasks',
  },
  {
    headline: '10 issues. 8 PRs. $1.84.',
    body: 'ralph-starter auto\n  --label "auto-ready"\n  --limit 10\n\nEach issue: own branch, own loop, own PR.\nWorks with GitHub and Linear.',
  },
  {
    headline: '8+ agents supported',
    body: 'Claude Code · Cursor · Codex CLI\nOpenCode · Gemini CLI · Copilot\nAmp · Openclaw\n\nAuto-detects. Same validation for all.',
  },
  {
    headline: 'What I actually do now',
    body: 'Write specs (input)\nReview PRs (output)\nArchitecture decisions\n\nEverything in between:\nralph-starter.',
  },
  {
    headline: 'Try it',
    body: 'npx ralph-starter init\n\nOpen source. MIT licensed.\ngithub.com/multivmlabs/ralph-starter',
  },
];
