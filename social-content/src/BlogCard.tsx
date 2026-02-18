import React from 'react';
import { AbsoluteFill } from 'remotion';
import { colors, fonts } from './design';

export const BlogCard: React.FC<{
  title: string;
  subtitle: string;
}> = ({ title, subtitle }) => {
  // Word-wrap title into 2 lines max
  const words = title.split(' ');
  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(' ');
  const line2 = words.slice(mid).join(' ');

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bgLight} 50%, ${colors.bg} 100%)`,
        overflow: 'hidden',
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(to right, ${colors.accent}, ${colors.accentOrange})`,
        }}
      />

      {/* Grid overlay */}
      <svg
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0.03,
        }}
      >
        {Array.from({ length: 30 }, (_, i) => (
          <React.Fragment key={i}>
            <line x1={i * 40} y1="0" x2={i * 40} y2="630" stroke="white" strokeWidth="1" />
            <line x1="0" y1={i * 40} x2="1200" y2={i * 40} stroke="white" strokeWidth="1" />
          </React.Fragment>
        ))}
      </svg>

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 80px',
          height: '100%',
        }}
      >
        <h1
          style={{
            fontFamily: fonts.heading,
            fontSize: 52,
            fontWeight: 800,
            color: colors.text,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {line1}
          {line2 && <br />}
          {line2}
        </h1>

        <p
          style={{
            fontFamily: fonts.heading,
            fontSize: 24,
            color: colors.textMuted,
            marginTop: 20,
          }}
        >
          {subtitle}
        </p>

        {/* Brand footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 80,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span
            style={{
              fontFamily: fonts.heading,
              fontWeight: 700,
              fontSize: 22,
              color: colors.accent,
            }}
          >
            ralph-starter
          </span>
          <span
            style={{
              fontFamily: fonts.heading,
              fontSize: 18,
              color: colors.textDim,
            }}
          >
            ralphstarter.ai/blog
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
