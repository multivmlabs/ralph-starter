import React, { useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

interface Step {
  number: string;
  title: string;
  command: string;
  description: string;
  link: string;
}

const steps: Step[] = [
  {
    number: '1',
    title: 'Install',
    command: 'npm install -g ralph-starter',
    description: 'Install ralph-starter globally via npm',
    link: '/docs/installation',
  },
  {
    number: '2',
    title: 'Configure',
    command: 'ralph-starter init',
    description: 'Initialize your project with AI provider settings',
    link: '/docs/cli/init',
  },
  {
    number: '3',
    title: 'Run',
    command: 'ralph-starter run "build a login page"',
    description: 'Start an autonomous coding loop',
    link: '/docs/cli/run',
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      className={styles.copyButton}
      onClick={handleCopy}
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
    </button>
  );
}

export default function QuickStart(): React.ReactElement {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.quickStart}>
      <div className={styles.container}>
        <div className={`${styles.content} ${isVisible ? styles.visible : ''}`}>
          <div className={styles.header}>
            <span className={`${styles.sectionLabel} ${styles.animateIn}`}>
              Get Started
            </span>
            <h2 className={`${styles.title} ${styles.animateIn}`}>
              Three steps to autonomous coding
            </h2>
            <p className={`${styles.subtitle} ${styles.animateIn}`}>
              From installation to your first AI-generated code in under a minute
            </p>
          </div>

          <div className={styles.stepsGrid}>
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`${styles.step} ${styles.animateIn}`}
                style={{ transitionDelay: `${0.1 + index * 0.1}s` }}
              >
                <div className={styles.stepNumber}>{step.number}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <div className={styles.commandBox}>
                  <code className={styles.command}>{step.command}</code>
                  <CopyButton text={step.command} />
                </div>
                <p className={styles.stepDescription}>{step.description}</p>
                <Link to={step.link} className={styles.stepLink}>
                  Learn more
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.arrowIcon}>
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>

          <div className={`${styles.cta} ${styles.animateIn}`} style={{ transitionDelay: '0.4s' }}>
            <Link to="/docs/installation" className={styles.ctaButton}>
              Read the full guide
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
