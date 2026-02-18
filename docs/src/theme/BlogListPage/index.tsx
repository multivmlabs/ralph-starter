import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import type { Props } from '@theme/BlogListPage';

function BlogPostCard({ post }: { post: Props['items'][number] }) {
  const { content: BlogPostContent } = post;
  const { metadata } = BlogPostContent;
  const { permalink, title, date, readingTime, frontMatter, description } = metadata;
  const image = frontMatter.image as string | undefined;
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Link to={permalink} className="blog-card">
      {image && (
        <div className="blog-card__image">
          <img src={image} alt={title} loading="lazy" />
        </div>
      )}
      <div className="blog-card__body">
        <h2 className="blog-card__title">{title}</h2>
        {description && (
          <p className="blog-card__description">{description}</p>
        )}
        <div className="blog-card__meta">
          <span>{formattedDate}</span>
          {readingTime && (
            <>
              <span className="blog-card__separator">&middot;</span>
              <span>{Math.ceil(readingTime)} min read</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function BlogListPage(props: Props): JSX.Element {
  const { items } = props;
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title="Blog" description={`${siteConfig.title} blog`}>
      <main className="blog-list">
        <div className="blog-list__header">
          <h1>Blog</h1>
        </div>
        <div className="blog-list__grid">
          {items.map(({ content: BlogPostContent }) => (
            <BlogPostCard
              key={BlogPostContent.metadata.permalink}
              post={{ content: BlogPostContent }}
            />
          ))}
        </div>
      </main>
    </Layout>
  );
}
