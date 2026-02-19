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
    imgSrc:
      'https://img.shields.io/badge/built_with-ralph--starter-f59e0b?style=flat-square&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAABHklEQVR4nGNgGAWDATAyMDD8Z2Bg+M/AwPCfkZHxP0iMkZHxP7IAIyPjfwYGhv+srKz/GRkZGf6DACMj438GBob/LCws/0EYxIfxQWIgNkickZGR4T8LC8t/EA0TZ2Rk/A9ig9ggPhMT039GRkaG/0xMTP9BbJg4AwPDfyYmpv9MTEz/QTQTExPIfxgYGBj+MzEx/WdiYvrPxMT0H8YGiTMwMPwHYRA/PDz8f0hIyP+QkJD/ISEh/0NDQ/8HBwf/DwoKAov7+fn99/X1/e/j4/Pfx8fnv4+Pz38fHx+wuJeX139PT8//np6e/z09Pf97e3v/9/Ly+u/l5QUW9/Dw+O/u7v7fzc3tv5ub238XFxewuJOT038nJ6f/Tk5O/x0dHf87ODj8BwBQJIkWMXtBYwAAAABJRU5ErkJggg==',
  },
];

function getMarkdownSnippet(style: BadgeStyle): string {
  if (style === 'flat') {
    return `[![built with ralph-starter](https://img.shields.io/badge/built_with-ralph--starter-f59e0b?style=flat-square)](https://github.com/multivmlabs/ralph-starter)`;
  }
  const img = style === 'light' ? 'badge-built-with-light' : 'badge-built-with';
  return `[![built with ralph-starter](https://ralphstarter.ai/img/${img}@2x.png)](https://github.com/multivmlabs/ralph-starter)`;
}

function getHtmlSnippet(style: BadgeStyle): string {
  if (style === 'flat') {
    return `<a href="https://github.com/multivmlabs/ralph-starter"><img src="https://img.shields.io/badge/built_with-ralph--starter-f59e0b?style=flat-square" alt="built with ralph-starter" /></a>`;
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
