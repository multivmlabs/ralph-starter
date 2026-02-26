import React, { useEffect, useState } from 'react';
import styles from './styles.module.css';

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  prerelease: boolean;
  draft: boolean;
}

const REPO = 'multivmlabs/ralph-starter';
const API_URL = `https://api.github.com/repos/${REPO}/releases`;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Convert basic markdown to HTML (headings, bold, lists, code, links). */
function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '\n');
}

function ReleaseCard({ release }: { release: GitHubRelease }) {
  return (
    <div className={styles.release}>
      <div className={styles.releaseHeader}>
        <a href={release.html_url} target="_blank" rel="noopener noreferrer" className={styles.releaseTag}>
          {release.tag_name}
        </a>
        {release.prerelease && <span className={styles.prerelease}>pre-release</span>}
        <span className={styles.releaseDate}>{formatDate(release.published_at)}</span>
      </div>
      {release.name && release.name !== release.tag_name && (
        <h3 className={styles.releaseName}>{release.name}</h3>
      )}
      {release.body && (
        <div
          className={styles.releaseBody}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(release.body) }}
        />
      )}
    </div>
  );
}

export default function GitHubReleases(): React.ReactElement {
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}?per_page=20`)
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
        return res.json();
      })
      .then((data: GitHubRelease[]) => {
        setReleases(data.filter((r) => !r.draft));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Loading releases from GitHub...</span>
      </div>
    );
  }

  if (error || releases.length === 0) {
    return (
      <div className={styles.fallback}>
        <p>
          {error
            ? 'Could not load releases from GitHub. '
            : 'No releases found. '}
          View all releases on{' '}
          <a href={`https://github.com/${REPO}/releases`} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.liveIndicator} />
        <span>Live from <a href={`https://github.com/${REPO}/releases`} target="_blank" rel="noopener noreferrer">GitHub Releases</a></span>
      </div>
      {releases.map((release) => (
        <ReleaseCard key={release.id} release={release} />
      ))}
    </div>
  );
}
