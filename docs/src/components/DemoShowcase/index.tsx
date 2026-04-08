import React, { useEffect, useRef, useState } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

interface Demo {
  id: string;
  label: string;
  gif: string;
  caption: string;
}

const demos: Demo[] = [
  {
    id: 'figma',
    label: 'Figma',
    gif: '/img/demos/figma-demo.gif',
    caption: 'Interactive wizard — paste a Figma URL, pick your stack, visual validation until pixel-perfect.',
  },
  {
    id: 'github',
    label: 'GitHub',
    gif: '/img/demos/github-demo.gif',
    caption: 'Fetch an issue, run AI loops, and open a PR — all from one command.',
  },
  {
    id: 'linear',
    label: 'Linear',
    gif: '/img/demos/linear-demo.gif',
    caption: 'Pull sprint tickets from Linear and implement them autonomously.',
  },
  {
    id: 'notion',
    label: 'Notion',
    gif: '/img/demos/notion-demo.gif',
    caption: 'Parse a Notion spec page and scaffold a full project with tests.',
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
        <p className={`${styles.sectionLabel} ${styles.animateIn}`}>See It In Action</p>
        <h2 className={`${styles.title} ${styles.animateIn} ${styles.delay1}`}>
          One CLI, Four Integrations
        </h2>
        <p className={`${styles.subtitle} ${styles.animateIn} ${styles.delay1}`}>
          Watch ralph-starter connect to your tools and build code autonomously.
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

        <div className={`${styles.demoFrame} ${styles.animateIn} ${styles.delay2}`}>
          <img
            key={active.id}
            src={useBaseUrl(active.gif)}
            alt={`${active.label} demo`}
            className={styles.demoGif}
          />
        </div>

        <p className={`${styles.caption} ${styles.animateIn} ${styles.delay3}`}>
          {active.caption}
        </p>
      </div>
    </section>
  );
}
