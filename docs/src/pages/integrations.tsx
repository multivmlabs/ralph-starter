import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './integrations.module.css';

interface Integration {
  icon: string;
  name: string;
  description: string;
  features: string[];
  setupSteps: string[];
  docsLink: string;
  externalLink?: string;
}

const integrations: Integration[] = [
  {
    icon: '/img/figma-logo.svg',
    name: 'Figma',
    description: 'Extract designs, components, and design tokens directly from your Figma files. ralph-starter understands layers, auto-layout, and styling to generate accurate code.',
    features: [
      'Component extraction and conversion',
      'Design token parsing (colors, typography, spacing)',
      'Auto-layout to flexbox/grid conversion',
      'Asset export and optimization',
    ],
    setupSteps: [
      'Generate a Figma Personal Access Token',
      'ralph-starter config set figma.token your_token',
      'ralph-starter run --from figma --project "file-url"',
    ],
    docsLink: '/docs/sources/figma',
    externalLink: 'https://www.figma.com/developers/api',
  },
  {
    icon: '/img/github logo.webp',
    name: 'GitHub',
    description: 'Connect to GitHub repositories to fetch issues, PRs, and file content. ralph-starter uses this context to understand your codebase and implement solutions.',
    features: [
      'Issue and PR content extraction',
      'Repository file access',
      'Linked issue detection',
      'Comment and discussion context',
    ],
    setupSteps: [
      'Generate a GitHub Personal Access Token',
      'ralph-starter config set github.token your_token',
      'ralph-starter run --from github --project owner/repo --issue 123',
    ],
    docsLink: '/docs/sources/github',
    externalLink: 'https://github.com/settings/tokens',
  },
  {
    icon: '/img/linear.jpeg',
    name: 'Linear',
    description: 'Integrate with Linear to pull ticket details, project context, and team workflows. Perfect for automated sprint work and feature development.',
    features: [
      'Ticket details and metadata',
      'Project and team context',
      'Sub-issue hierarchy',
      'Custom field support',
    ],
    setupSteps: [
      'Generate a Linear API key from settings',
      'ralph-starter config set linear.apiKey your_key',
      'ralph-starter run --from linear --project ENG --issue ENG-123',
    ],
    docsLink: '/docs/sources/linear',
    externalLink: 'https://linear.app/settings/api',
  },
  {
    icon: '/img/notion logo.png',
    name: 'Notion',
    description: 'Fetch specifications, requirements, and documentation from Notion pages. Supports rich content including databases, code blocks, and nested pages.',
    features: [
      'Page content extraction',
      'Database query support',
      'Rich text and block parsing',
      'Nested page traversal',
    ],
    setupSteps: [
      'Create a Notion integration',
      'ralph-starter config set notion.token your_token',
      'ralph-starter run --from notion --project "page-id"',
    ],
    docsLink: '/docs/sources/notion',
    externalLink: 'https://www.notion.so/my-integrations',
  },
];

function IntegrationCard({ integration }: { integration: Integration }) {
  const iconSrc = useBaseUrl(integration.icon);

  return (
    <div className={styles.integrationCard}>
      <div className={styles.cardHeader}>
        <img src={iconSrc} alt={integration.name} className={styles.integrationIcon} />
        <h2 className={styles.integrationName}>{integration.name}</h2>
      </div>

      <p className={styles.integrationDescription}>{integration.description}</p>

      <div className={styles.featuresSection}>
        <h3 className={styles.sectionTitle}>Features</h3>
        <ul className={styles.featuresList}>
          {integration.features.map((feature) => (
            <li key={feature} className={styles.featureItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.checkIcon}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.setupSection}>
        <h3 className={styles.sectionTitle}>Quick Setup</h3>
        <ol className={styles.setupList}>
          {integration.setupSteps.map((step, index) => (
            <li key={index} className={styles.setupStep}>
              <span className={styles.stepNum}>{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.cardActions}>
        <Link to={integration.docsLink} className={styles.docsButton}>
          View Docs
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
        {integration.externalLink && (
          <a
            href={integration.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.externalLink}
          >
            Get API Key
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.externalIcon}>
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

export default function IntegrationsPage(): React.ReactElement {
  return (
    <Layout
      title="Integrations"
      description="Connect ralph-starter to Figma, GitHub, Linear, Notion and more. Fetch specs from where your work already lives."
    >
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <span className={styles.label}>Integrations</span>
            <h1 className={styles.title}>Connect your tools</h1>
            <p className={styles.subtitle}>
              Ralph-starter integrates with the tools you already use. Fetch designs, issues, tickets, and specs from anywhere.
            </p>
          </div>
        </section>

        <section className={styles.integrationsSection}>
          <div className={styles.container}>
            <div className={styles.integrationsGrid}>
              {integrations.map((integration) => (
                <IntegrationCard key={integration.name} integration={integration} />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.moreSection}>
          <div className={styles.container}>
            <div className={styles.moreCard}>
              <h2 className={styles.moreTitle}>More Input Sources</h2>
              <p className={styles.moreText}>
                Ralph-starter also supports local files, URLs, PDFs, and plain text input
              </p>
              <div className={styles.sourceChips}>
                <span className={styles.chip}>Local Files</span>
                <span className={styles.chip}>URLs</span>
                <span className={styles.chip}>PDFs</span>
                <span className={styles.chip}>Plain Text</span>
                <span className={styles.chip}>Clipboard</span>
              </div>
              <Link to="/docs/sources/overview" className={styles.moreLink}>
                View all input sources
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
