import React, { useState } from 'react';
import Layout from '@theme/Layout';
import styles from './badge.module.css';

type BadgeStyle = 'dark' | 'light';

interface BadgeOption {
  id: BadgeStyle;
  label: string;
  imgSrc: string;
  imgSrcset?: string;
}

const badgeOptions: BadgeOption[] = [
  {
    id: 'dark',
    label: 'Dark (default)',
    imgSrc: '/img/badge-built-with.png',
    imgSrcset: '/img/badge-built-with@2x.png 2x',
  },
  {
    id: 'light',
    label: 'Light',
    imgSrc: '/img/badge-built-with-light.png',
    imgSrcset: '/img/badge-built-with-light@2x.png 2x',
  },
];

function getMarkdownSnippet(style: BadgeStyle): string {
  const img = style === 'light' ? 'badge-built-with-light' : 'badge-built-with';
  return `[![built with ralph-starter](https://ralphstarter.ai/img/${img}@2x.png)](https://github.com/multivmlabs/ralph-starter)`;
}

function getHtmlSnippet(style: BadgeStyle): string {
  const img = style === 'light' ? 'badge-built-with-light' : 'badge-built-with';
  return `<a href="https://github.com/multivmlabs/ralph-starter"><img src="https://ralphstarter.ai/img/${img}@2x.png" alt="built with ralph-starter" height="28" /></a>`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className={styles.copyBtn} onClick={handleCopy} type="button">
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function BadgePage(): React.JSX.Element {
  const [selectedStyle, setSelectedStyle] = useState<BadgeStyle>('dark');
  const [format, setFormat] = useState<'markdown' | 'html'>('markdown');

  const selected = badgeOptions.find((b) => b.id === selectedStyle)!;
  const snippet = format === 'markdown' ? getMarkdownSnippet(selectedStyle) : getHtmlSnippet(selectedStyle);

  return (
    <Layout title="Badge" description="Add a 'built with ralph-starter' badge to your project">
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Add the badge to your project</h1>
          <p className={styles.subtitle}>
            Show that your project uses ralph-starter. Pick a style, copy the code, and paste it in
            your README.
          </p>

          <div className={styles.preview}>
            <img
              src={selected.imgSrc}
              srcSet={selected.imgSrcset}
              alt="built with ralph-starter"
              className={styles.badgeImg}
            />
          </div>

          <div className={styles.options}>
            <div className={styles.optionGroup}>
              <label className={styles.label}>Style</label>
              <div className={styles.btnGroup}>
                {badgeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    className={`${styles.optionBtn} ${selectedStyle === opt.id ? styles.active : ''}`}
                    onClick={() => setSelectedStyle(opt.id)}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.optionGroup}>
              <label className={styles.label}>Format</label>
              <div className={styles.btnGroup}>
                <button
                  className={`${styles.optionBtn} ${format === 'markdown' ? styles.active : ''}`}
                  onClick={() => setFormat('markdown')}
                  type="button"
                >
                  Markdown
                </button>
                <button
                  className={`${styles.optionBtn} ${format === 'html' ? styles.active : ''}`}
                  onClick={() => setFormat('html')}
                  type="button"
                >
                  HTML
                </button>
              </div>
            </div>
          </div>

          <div className={styles.codeBlock}>
            <div className={styles.codeHeader}>
              <span>{format === 'markdown' ? 'README.md' : 'index.html'}</span>
              <CopyButton text={snippet} />
            </div>
            <pre className={styles.code}>
              <code>{snippet}</code>
            </pre>
          </div>
        </div>
      </main>
    </Layout>
  );
}
