import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './use-cases.module.css';

interface UseCase {
  icon: string;
  source: string;
  title: string;
  description: string;
  workflow: string[];
  command: string;
  docsLink: string;
}

const useCases: UseCase[] = [
  {
    icon: '/img/figma-logo.svg',
    source: 'Figma',
    title: 'Design to Code',
    description: 'Transform Figma designs into production-ready React components. ralph-starter extracts design tokens, component structure, and styling to generate responsive, accessible code.',
    workflow: [
      'Connect your Figma file via URL or file key',
      'ralph-starter analyzes the design hierarchy and styles',
      'Components are generated with proper TypeScript types',
      'Styling is applied using your preferred CSS solution',
    ],
    command: 'ralph-starter run --from figma --project "https://figma.com/file/..."',
    docsLink: '/docs/sources/figma',
  },
  {
    icon: '/img/github logo.webp',
    source: 'GitHub',
    title: 'Issue to Implementation',
    description: 'Turn GitHub issues into working code automatically. ralph-starter reads the issue description, linked files, and discussions to understand context and implement the solution.',
    workflow: [
      'Reference a GitHub issue by URL or number',
      'ralph-starter fetches issue details, labels, and linked content',
      'AI analyzes requirements and plans implementation',
      'Code is generated, tested, and optionally committed',
    ],
    command: 'ralph-starter run --from github --project owner/repo --issue 123',
    docsLink: '/docs/sources/github',
  },
  {
    icon: '/img/linear.jpeg',
    source: 'Linear',
    title: 'Ticket to Feature',
    description: 'Connect Linear and let AI handle your engineering tickets. ralph-starter understands project context, linked documents, and team conventions to deliver consistent code.',
    workflow: [
      'Authenticate with your Linear workspace',
      'Select tickets by ID or filter by project/status',
      'ralph-starter reads ticket details and sub-issues',
      'Implementation follows your project patterns',
    ],
    command: 'ralph-starter run --from linear --project ENG --issue ENG-123',
    docsLink: '/docs/sources/linear',
  },
  {
    icon: '/img/notion logo.png',
    source: 'Notion',
    title: 'Spec to Software',
    description: 'Write detailed specifications in Notion and let ralph-starter build them. Perfect for PRDs, technical specs, and feature documentation.',
    workflow: [
      'Write your spec in a Notion page',
      'Include requirements, acceptance criteria, and examples',
      'ralph-starter parses the structured content',
      'Features are built according to your specification',
    ],
    command: 'ralph-starter run --from notion --project "page-id"',
    docsLink: '/docs/sources/notion',
  },
];

function UseCaseCard({ useCase }: { useCase: UseCase }) {
  const iconSrc = useBaseUrl(useCase.icon);

  return (
    <div className={styles.useCaseCard}>
      <div className={styles.cardHeader}>
        <img src={iconSrc} alt={useCase.source} className={styles.sourceIcon} />
        <span className={styles.sourceLabel}>{useCase.source}</span>
      </div>

      <h2 className={styles.useCaseTitle}>{useCase.title}</h2>
      <p className={styles.useCaseDescription}>{useCase.description}</p>

      <div className={styles.workflowSection}>
        <h3 className={styles.workflowTitle}>How it works</h3>
        <ol className={styles.workflowList}>
          {useCase.workflow.map((step, index) => (
            <li key={index} className={styles.workflowStep}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <span className={styles.stepText}>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.commandSection}>
        <code className={styles.command}>{useCase.command}</code>
      </div>

      <Link to={useCase.docsLink} className={styles.docsLink}>
        View documentation
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.arrowIcon}>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

export default function UseCasesPage(): React.ReactElement {
  return (
    <Layout
      title="Use Cases"
      description="Learn how to use ralph-starter with Figma, GitHub, Linear, and Notion to automate your development workflow."
    >
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <span className={styles.label}>Use Cases</span>
            <h1 className={styles.title}>From any source to working code</h1>
            <p className={styles.subtitle}>
              See how ralph-starter connects to your tools and transforms specifications into production-ready implementations
            </p>
          </div>
        </section>

        <section className={styles.useCasesSection}>
          <div className={styles.container}>
            <div className={styles.useCasesGrid}>
              {useCases.map((useCase) => (
                <UseCaseCard key={useCase.source} useCase={useCase} />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <div className={styles.ctaCard}>
              <h2 className={styles.ctaTitle}>Ready to automate your workflow?</h2>
              <p className={styles.ctaText}>
                Get started with ralph-starter and connect your favorite tools
              </p>
              <div className={styles.ctaActions}>
                <Link to="/docs/installation" className={styles.primaryButton}>
                  Get Started
                </Link>
                <Link to="/docs/sources/overview" className={styles.secondaryButton}>
                  View All Sources
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
