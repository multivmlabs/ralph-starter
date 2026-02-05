import React, { useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

interface Client {
  name: string;
  logo: string;
  tooltip: string;
}

const clients: Client[] = [
  {
    name: 'Openclaw',
    logo: '/img/openclaw.svg',
    tooltip: 'cargo install openclaw',
  },
  {
    name: 'Claude Code',
    logo: '/img/claude-icon.svg',
    tooltip: 'npm i -g @anthropic-ai/claude-code',
  },
  {
    name: 'OpenCode',
    logo: '/img/opencode-icon.svg',
    tooltip: 'npm i -g opencode',
  },
  {
    name: 'Cursor',
    logo: '/img/cursor-icon.svg',
    tooltip: 'Download from cursor.com',
  },
  {
    name: 'OpenAI Codex',
    logo: '/img/openai-icon.svg',
    tooltip: 'npm i -g @openai/codex',
  },
  {
    name: 'GitHub Copilot',
    logo: '/img/githubcopilot-color.svg',
    tooltip: 'gh extension install github/gh-copilot',
  },
  {
    name: 'Gemini CLI',
    logo: '/img/gemini-color.svg',
    tooltip: 'npm i -g @google/gemini-cli',
  },
  {
    name: 'Amp',
    logo: '/img/amp-logo.svg',
    tooltip: 'npm i -g @anthropic/amp',
  },
];

export default function ClientShowcase(): React.ReactElement {
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
    <section ref={sectionRef} className={styles.showcase}>
      <div className={styles.container}>
        <div className={`${styles.content} ${isVisible ? styles.visible : ''}`}>
          <div className={styles.labelRow}>
            <span className={`${styles.sectionLabel} ${styles.animateIn}`}>
              Works with all clients
            </span>
          </div>

          <div className={styles.clientsRow}>
            {clients.map((client, index) => (
              <div
                key={client.name}
                className={`${styles.client} ${styles.animateIn}`}
                style={{ transitionDelay: `${0.1 + index * 0.05}s` }}
              >
                <img
                  src={useBaseUrl(client.logo)}
                  alt={client.name}
                  className={styles.clientIcon}
                />
                <span className={styles.clientName}>{client.name}</span>
                <span className={styles.tooltip}>{client.tooltip}</span>
              </div>
            ))}

            <Link
              to="/docs/installation#setting-up-a-coding-agent"
              className={`${styles.learnMore} ${styles.animateIn}`}
              style={{ transitionDelay: `${0.1 + clients.length * 0.05}s` }}
            >
              Learn More
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.arrowIcon}>
                <path d="M7 17L17 7M17 7H7M17 7V17"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
