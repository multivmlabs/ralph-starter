import React, { useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

interface Demo {
  id: string;
  label: string;
  command: string;
  lines: { text: string; type: 'dim' | 'normal' | 'success' | 'accent' | 'warn' }[];
  caption: string;
  link: string;
}

const demos: Demo[] = [
  {
    id: 'openspec',
    label: 'OpenSpec',
    command: 'ralph-starter run --from openspec:add-auth --spec-validate',
    lines: [
      { text: '  Spec validation: 87/100', type: 'dim' },
      { text: '  Format: OpenSpec (proposal + design + 3 specs)', type: 'dim' },
      { text: '  Acceptance criteria: 4 criterion(s) extracted', type: 'dim' },
      { text: '', type: 'normal' },
      { text: '  Using: claude-code', type: 'accent' },
      { text: '  Iteration 1/10 | Building auth middleware...', type: 'normal' },
      { text: '  Iteration 2/10 | Writing tests for JWT validation...', type: 'normal' },
      { text: '  Lint: pass | Build: pass | Tests: 12/12 pass', type: 'success' },
      { text: '', type: 'normal' },
      { text: '  Committed: feat: add JWT auth middleware', type: 'success' },
      { text: '  PR #42 created: feat: add JWT auth middleware', type: 'success' },
    ],
    caption: 'Read structured specs from OpenSpec directories. Validate completeness before spending tokens.',
    link: '/docs/sources/openspec',
  },
  {
    id: 'figma',
    label: 'Figma',
    command: 'ralph-starter figma',
    lines: [
      { text: '  ? Figma URL: https://figma.com/design/ABC123/Landing', type: 'dim' },
      { text: '  ? What to build: responsive hero with parallax', type: 'dim' },
      { text: '  ? Stack: Next.js + TypeScript + Tailwind CSS (Detected)', type: 'dim' },
      { text: '', type: 'normal' },
      { text: '  Fetching from Figma API... 8 frames, 21 components', type: 'accent' },
      { text: '  Iteration 1/10 | Scaffolding component structure...', type: 'normal' },
      { text: '  Iteration 2/10 | Applying design tokens + layout...', type: 'normal' },
      { text: '  Visual validation: 94% match', type: 'success' },
      { text: '', type: 'normal' },
      { text: '  Committed: feat: landing page hero section', type: 'success' },
    ],
    caption: 'Paste a Figma URL, pick your stack, get pixel-perfect code with visual validation.',
    link: '/docs/sources/figma',
  },
  {
    id: 'github',
    label: 'GitHub',
    command: 'ralph-starter run --from github --project myorg/api --label ready',
    lines: [
      { text: '  Fetching issues with label "ready"...', type: 'dim' },
      { text: '  Found: #127 Add rate limiting to /api/search', type: 'accent' },
      { text: '', type: 'normal' },
      { text: '  Iteration 1/10 | Implementing rate limiter...', type: 'normal' },
      { text: '  Iteration 2/10 | Adding Redis sliding window...', type: 'normal' },
      { text: '  Lint: pass | Build: pass | Tests: 8/8 pass', type: 'success' },
      { text: '', type: 'normal' },
      { text: '  Committed: feat: add rate limiting to search API', type: 'success' },
      { text: '  PR #128 created (closes #127)', type: 'success' },
    ],
    caption: 'Fetch issues by label, implement autonomously, open PRs that close the issue.',
    link: '/docs/sources/github',
  },
  {
    id: 'linear',
    label: 'Linear',
    command: 'ralph-starter run --from linear --project "Backend" --linear-sync ENG-42',
    lines: [
      { text: '  Fetching from Linear: "Backend" project...', type: 'dim' },
      { text: '  Found: ENG-42 Migrate user service to gRPC', type: 'accent' },
      { text: '  Linear status: In Progress', type: 'dim' },
      { text: '', type: 'normal' },
      { text: '  Iteration 1/10 | Generating proto definitions...', type: 'normal' },
      { text: '  Iteration 2/10 | Implementing service + tests...', type: 'normal' },
      { text: '  Lint: pass | Build: pass | Tests: 15/15 pass', type: 'success' },
      { text: '', type: 'normal' },
      { text: '  Linear status: Done', type: 'success' },
      { text: '  PR #89 created', type: 'success' },
    ],
    caption: 'Pull tickets from Linear, sync status in real-time, auto-update when done.',
    link: '/docs/sources/linear',
  },
  {
    id: 'notion',
    label: 'Notion',
    command: 'ralph-starter run --from notion --project "https://notion.so/spec-abc"',
    lines: [
      { text: '  Fetching Notion page...', type: 'dim' },
      { text: '  Parsed: "Payment Integration Spec" (2,400 words)', type: 'accent' },
      { text: '', type: 'normal' },
      { text: '  Iteration 1/10 | Creating Stripe webhook handler...', type: 'normal' },
      { text: '  Iteration 2/10 | Adding idempotency + error handling...', type: 'normal' },
      { text: '  Iteration 3/10 | Fixing webhook signature validation...', type: 'normal' },
      { text: '  Lint: pass | Build: pass | Tests: 11/11 pass', type: 'success' },
      { text: '', type: 'normal' },
      { text: '  Committed: feat: Stripe payment webhooks', type: 'success' },
    ],
    caption: 'Parse Notion specs and turn them into working code with full test coverage.',
    link: '/docs/sources/notion',
  },
];

export default function DemoShowcase(): React.ReactElement {
  const [activeTab, setActiveTab] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const active = demos[activeTab];

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.gridBg} />
      <div className={`${styles.container} ${isVisible ? styles.visible : ''}`}>
        <p className={`${styles.sectionLabel} ${styles.animateIn}`}>Spec Driven Development</p>
        <h2 className={`${styles.title} ${styles.animateIn} ${styles.delay1}`}>
          One CLI, Five Sources
        </h2>
        <p className={`${styles.subtitle} ${styles.animateIn} ${styles.delay1}`}>
          Pull specs from OpenSpec, Figma, GitHub, Linear, or Notion. Validate. Build. Ship.
        </p>

        <div className={`${styles.tabs} ${styles.animateIn} ${styles.delay2}`}>
          {demos.map((demo, i) => (
            <button
              key={demo.id}
              type="button"
              className={`${styles.tab} ${i === activeTab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(i)}
            >
              {demo.label}
            </button>
          ))}
        </div>

        <div className={`${styles.terminal} ${styles.animateIn} ${styles.delay2}`}>
          <div className={styles.terminalHeader}>
            <span className={`${styles.dot} ${styles.dotRed}`} />
            <span className={`${styles.dot} ${styles.dotYellow}`} />
            <span className={`${styles.dot} ${styles.dotGreen}`} />
            <span className={styles.terminalTitle}>ralph-starter</span>
          </div>
          <div className={styles.terminalBody}>
            <div className={styles.commandLine}>
              <span className={styles.prompt}>$</span>
              <span className={styles.command}>{active.command}</span>
            </div>
            <div className={styles.output}>
              {active.lines.map((line, i) => (
                <div key={`${active.id}-${i}`} className={styles[`line_${line.type}`]}>
                  {line.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className={`${styles.caption} ${styles.animateIn} ${styles.delay3}`}>
          {active.caption}{' '}
          <Link to={active.link} className={styles.captionLink}>
            Learn more →
          </Link>
        </p>
      </div>
    </section>
  );
}
