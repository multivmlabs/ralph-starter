import React, { useState } from 'react';
import Layout from '@theme/Layout';
import styles from './badge.module.css';

type BadgeStyle = 'dark' | 'light' | 'flat';

interface BadgeOption {
  id: BadgeStyle;
  label: string;
  imgSrc: string;
  imgSrcset?: string;
}

const RALPH_LOGO_BASE64 =
  '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';

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
  {
    id: 'flat',
    label: 'Flat (shields.io)',
    imgSrc: `https://img.shields.io/badge/built_with-ralph--starter-f59e0b?style=flat-square&logo=data:image/png;base64,${RALPH_LOGO_BASE64}`,
  },
];

function getShieldsUrl(): string {
  return `https://img.shields.io/badge/built_with-ralph--starter-f59e0b?style=flat-square&logo=data:image/png;base64,${RALPH_LOGO_BASE64}`;
}

function getMarkdownSnippet(style: BadgeStyle): string {
  if (style === 'flat') {
    return `[![built with ralph-starter](${getShieldsUrl()})](https://github.com/multivmlabs/ralph-starter)`;
  }
  const img = style === 'light' ? 'badge-built-with-light' : 'badge-built-with';
  return `[![built with ralph-starter](https://ralphstarter.ai/img/${img}@2x.png)](https://github.com/multivmlabs/ralph-starter)`;
}

function getHtmlSnippet(style: BadgeStyle): string {
  if (style === 'flat') {
    return `<a href="https://github.com/multivmlabs/ralph-starter"><img src="${getShieldsUrl()}" alt="built with ralph-starter" /></a>`;
  }
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
              className={selectedStyle === 'flat' ? styles.badgeImgFlat : styles.badgeImg}
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
