import React, { useEffect, useState, useCallback } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

interface DemoScenario {
  id: 'figma' | 'github' | 'linear' | 'notion';
  tagline: [string, string];
  subtitle: string;
  command: string;
  outputLines: string[];
  successLine: string;
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'figma',
    tagline: ['Design in Figma.', 'Ship pixel-perfect code.'],
    subtitle:
      'Point ralph-starter at a Figma file and get production-ready components with visual validation.',
    command: 'ralph-starter figma',
    outputLines: [
      '  Figma to Code',
      '? Figma URL: https://figma.com/design/ABC123/Dashboard',
      '? Build: responsive dashboard with sidebar nav',
      '? Stack: Next.js + TypeScript + Tailwind CSS',
      '\u2192 Fetching Figma API... 8 frames, 21 components',
      '\u2192 Visual validation: 98.2% pixel match',
    ],
    successLine: '\u2713 Done! Cost: $0.94 | 3 commits',
  },
  {
    id: 'github',
    tagline: ['Specs on GitHub.', 'Code ships itself.'],
    subtitle:
      'Point ralph-starter at a GitHub issue and get a fully implemented feature with tests and a PR.',
    command: 'ralph-starter run --from github --issue 42',
    outputLines: [
      '\u2192 Fetching GitHub issue #42...',
      '  Found: "Add user authentication"',
      '  Labels: feature, auth',
      '\u2192 Loop 1/5: Generating auth module...',
      '\u2192 Loop 2/5: Adding tests and validation...',
      '\u2192 Validation passed: 12 tests, lint clean',
    ],
    successLine: '\u2713 Done! Cost: $0.38 | PR #87 created',
  },
  {
    id: 'linear',
    tagline: ['Tickets in Linear.', 'Features in production.'],
    subtitle:
      'Pull Linear tickets and let AI agents implement them end-to-end with automatic commits.',
    command: 'ralph-starter run --from linear --label ready',
    outputLines: [
      '\u2192 Fetching Linear issues (ready)...',
      '  Found 4 issues: RAL-41, RAL-42, RAL-43, RAL-44',
      '\u2192 Processing RAL-42: "Dark mode toggle"',
      '\u2192 Loop 1/8: Implementing theme provider...',
      '\u2192 Loop 2/8: Adding CSS variables...',
      '\u2192 Validation passed: build clean',
    ],
    successLine: '\u2713 Done! Cost: $0.52 | 5 commits',
  },
  {
    id: 'notion',
    tagline: ['Specs in Notion.', 'Code writes itself.'],
    subtitle:
      'Import requirements from Notion pages and let AI agents turn them into production-ready code.',
    command: 'ralph-starter run --from notion --project "API Spec"',
    outputLines: [
      '\u2192 Fetching Notion page: "API Spec"...',
      '  Parsed: 3 sections, 12 endpoints',
      '\u2192 Loop 1/6: Scaffolding Express routes...',
      '\u2192 Loop 2/6: Adding middleware & validation...',
      '\u2192 Loop 3/6: Writing integration tests...',
      '\u2192 Validation passed: 18 tests, lint clean',
    ],
    successLine: '\u2713 Done! Cost: $0.61 | 4 commits',
  },
];

export default function HeroSection(): React.ReactElement {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scenarioIndex, setScenarioIndex] = useState(0);

  useEffect(() => {
    setScenarioIndex(Math.floor(Math.random() * DEMO_SCENARIOS.length));
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const scenario = DEMO_SCENARIOS[scenarioIndex];

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText('npx ralph-starter');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. non-HTTPS context)
    }
  }, []);

  return (
    <section className={styles.hero}>
      {/* Grid background */}
      <div className={styles.gridBackground}>
        {/* Horizontal trails on grid rows */}
        <div className={`${styles.trail} ${styles.trailH} ${styles.trailH1}`} />
        <div className={`${styles.trail} ${styles.trailH} ${styles.trailH2}`} />
        <div className={`${styles.trail} ${styles.trailH} ${styles.trailH3}`} />
        {/* Vertical trails on grid columns */}
        <div className={`${styles.trail} ${styles.trailV} ${styles.trailV1}`} />
        <div className={`${styles.trail} ${styles.trailV} ${styles.trailV2}`} />
        <div className={`${styles.trail} ${styles.trailV} ${styles.trailV3}`} />
      </div>

      {/* Ralph astronaut - large, centered behind content */}
      <div className={`${styles.ralphContainer} ${isVisible ? styles.visible : ''}`}>
        <img
          src={useBaseUrl('/img/astronaut-fly.png')}
          alt="Ralph Astronaut"
          className={styles.ralphImage}
        />
      </div>

      <div className={`${styles.heroWrapper} ${isVisible ? styles.visible : ''}`}>
        <div className={styles.heroInner}>
          {/* Left: Text content */}
          <div className={styles.heroContent}>
            <h1 className={`${styles.tagline} ${styles.animateIn} ${styles.delay1}`}>
              {scenario.tagline[0]}<br />
              {scenario.tagline[1]}
            </h1>

            <p className={`${styles.subtitle} ${styles.animateIn} ${styles.delay2}`}>
              {scenario.subtitle} Also works with {
                ['Figma', 'GitHub', 'Linear', 'Notion']
                  .filter(name => name.toLowerCase() !== scenario.id)
                  .join(', ')
              } specs.
            </p>

            {/* CTA row: button + install command + integrations */}
            <div className={`${styles.ctaRow} ${styles.animateIn} ${styles.delay2}`}>
              <Link
                className={`${styles.button} ${styles.buttonPrimary}`}
                to="/docs/intro">
                Get Started →
              </Link>
              <button
                type="button"
                className={styles.installCommand}
                onClick={handleCopy}
                title="Copy to clipboard">
                <code>npx ralph-starter</code>
                <svg
                  className={styles.copyIcon}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  {copied ? (
                    <polyline points="20 6 9 17 4 12" />
                  ) : (
                    <>
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Right: Terminal + Integrations */}
          <div className={`${styles.heroVisual} ${styles.animateIn} ${styles.delay3}`}>
            <div className={styles.terminal}>
              <div className={styles.terminalHeader}>
                <span className={`${styles.terminalDot} ${styles.red}`}></span>
                <span className={`${styles.terminalDot} ${styles.yellow}`}></span>
                <span className={`${styles.terminalDot} ${styles.green}`}></span>
              </div>
              <div className={styles.terminalBody}>
                <div className={styles.terminalLine}>
                  <span className={styles.terminalPrompt}>$</span>
                  <span className={styles.terminalCommand}> {scenario.command}</span>
                </div>
                <div className={styles.terminalOutput}>
                  {scenario.outputLines.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                  <div className={styles.terminalSuccess}>{scenario.successLine}</div>
                </div>
              </div>
            </div>

            {/* Integration logos with links */}
            <div className={styles.integrations}>
              <span className={styles.integrationLabel}>Integrations</span>
              <div className={styles.integrationLogos}>
                {[
                  { id: 'figma' as const, to: '/docs/cli/figma', src: '/img/figma-logo.svg', alt: 'Figma' },
                  { id: 'github' as const, to: '/docs/sources/github', src: '/img/github logo.webp', alt: 'GitHub' },
                  { id: 'linear' as const, to: '/docs/sources/linear', src: '/img/linear.jpeg', alt: 'Linear' },
                  { id: 'notion' as const, to: '/docs/sources/notion', src: '/img/notion logo.png', alt: 'Notion' },
                ].map(({ id, to, src, alt }) => (
                  <Link key={id} to={to} className={styles.integrationLink}>
                    <img
                      src={useBaseUrl(src)}
                      alt={alt}
                      className={`${styles.integrationLogo} ${scenario.id === id ? styles.integrationLogoActive : ''}`}
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
