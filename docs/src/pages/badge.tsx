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
      'https://img.shields.io/badge/built_with-ralph--starter-f59e0b?style=flat-square&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAAolt3jAAACKFBMVEUAAAAMCw4DAgUQDAUwJAo3KgsvJAodFggAAAQIBwgNCwwDAgEDAwQxJQmGZhIEBAUJCAUWFRYICAgBAQQGBQUDAwURDQaQbQ6KaA7YoxMAAAX/3SvpzmMJCw4HBgcKDBEuSWsJCQkHBwmJ6P8ZJTVFdKkKCQoGBgcICg0ICxAODg0QDQUGBgkSGyYQGCIEAwIHCAoSEBAAAAAIBgUmHQoqIAopIAoOCwcAAAMfGAk9LwtZRAx8Xg+QbQ99Xw9sUg0uIwoAAAIQDwoAAAUyJgluUwx/YA8yJggAAAAAAAYiGgaLbRpzVw0IBwZyVAWehjy9jxAxJQgAAABrUAq/lR3CkhBJNwoAAAEAAACIZw53Wg4AAAAAAAByVw2PbA52WQ2zhxCWcQ5VQAwAABInJh7IlxE2OTMAAAAuSmw2UHArRWYJCw8rRGMwTXFqWCCQbQ8yOjwlP2I4W4c6X40sRmYWIS8ICQsHBwoEBAgHCQ8HBgYAAAAPFR4OFBykew+xhhC/kA/QnA69jw+sghCZkWunlVflrBC7mTWgmXK8mTPAkQ+2iRC3x8ylrKTHmBaon3O6zdekn3zdpg/mrRChlWGUfjnZow/JoSuqnWjDnjL9vg/4uxDdpg26iw7orxD1uA/nrQ3QnA/iqhDxthCvhBG/kBDAkBDFlQ/DkxDjqxD2uQ//wBD4uhDgqhLmrhHiqxKggyi5jxf/wA+hhStOYm9Wa3hUbH1DaJJKsPrXAAAAfnRSTlMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAkvUFc/FRFctOr7/fTLXAYBJpf69nsEBUrg4z9X/fd/B1n9/oYJA5abAQJiwdv91EEccPGJBZf5nxq+0e3ysIXY3pAjCB0ROUUIJSDq3NCgAAAA3UlEQVQI1wHSAC3/AAAAAQACAwQFBgcICQAAAAoLDA0yMzQ1NjcODxARABITODk6Ozw9Pj9AQQgUAEJDREV+f4CBgoNGR0gVAElKS4SFhoeIiYqLTE0WABdOT4yNjo+QkZKTUFFSABhTVJSVlpeYmZqbVVZXAFhZk5ydnp+goaKjpFpbAFxdXl9gpaanqKmqYWIZABobY2Rlq6ytrq+wZhwAAB1naGmxsrO0tba3algeAB9rbG1ub3BxcnN0dSAhACJ2d3h5ensjfH1bJCUmACciKCkqKywALS4vMDEAnlFDNZZ4UAoAAAAASUVORK5CYII=',
  },
];

const RALPH_LOGO_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAAolt3jAAACKFBMVEUAAAAMCw4DAgUQDAUwJAo3KgsvJAodFggAAAQIBwgNCwwDAgEDAwQxJQmGZhIEBAUJCAUWFRYICAgBAQQGBQUDAwURDQaQbQ6KaA7YoxMAAAX/3SvpzmMJCw4HBgcKDBEuSWsJCQkHBwmJ6P8ZJTVFdKkKCQoGBgcICg0ICxAODg0QDQUGBgkSGyYQGCIEAwIHCAoSEBAAAAAIBgUmHQoqIAopIAoOCwcAAAMfGAk9LwtZRAx8Xg+QbQ99Xw9sUg0uIwoAAAIQDwoAAAUyJgluUwx/YA8yJggAAAAAAAYiGgaLbRpzVw0IBwZyVAWehjy9jxAxJQgAAABrUAq/lR3CkhBJNwoAAAEAAACIZw53Wg4AAAAAAAByVw2PbA52WQ2zhxCWcQ5VQAwAABInJh7IlxE2OTMAAAAuSmw2UHArRWYJCw8rRGMwTXFqWCCQbQ8yOjwlP2I4W4c6X40sRmYWIS8ICQsHBwoEBAgHCQ8HBgYAAAAPFR4OFBykew+xhhC/kA/QnA69jw+sghCZkWunlVflrBC7mTWgmXK8mTPAkQ+2iRC3x8ylrKTHmBaon3O6zdekn3zdpg/mrRChlWGUfjnZow/JoSuqnWjDnjL9vg/4uxDdpg26iw7orxD1uA/nrQ3QnA/iqhDxthCvhBG/kBDAkBDFlQ/DkxDjqxD2uQ//wBD4uhDgqhLmrhHiqxKggyi5jxf/wA+hhStOYm9Wa3hUbH1DaJJKsPrXAAAAfnRSTlMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAkvUFc/FRFctOr7/fTLXAYBJpf69nsEBUrg4z9X/fd/B1n9/oYJA5abAQJiwdv91EEccPGJBZf5nxq+0e3ysIXY3pAjCB0ROUUIJSDq3NCgAAAA3UlEQVQI1wHSAC3/AAAAAQACAwQFBgcICQAAAAoLDA0yMzQ1NjcODxARABITODk6Ozw9Pj9AQQgUAEJDREV+f4CBgoNGR0gVAElKS4SFhoeIiYqLTE0WABdOT4yNjo+QkZKTUFFSABhTVJSVlpeYmZqbVVZXAFhZk5ydnp+goaKjpFpbAFxdXl9gpaanqKmqYWIZABobY2Rlq6ytrq+wZhwAAB1naGmxsrO0tba3algeAB9rbG1ub3BxcnN0dSAhACJ2d3h5ensjfH1bJCUmACciKCkqKywALS4vMDEAnlFDNZZ4UAoAAAAASUVORK5CYII=';

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
