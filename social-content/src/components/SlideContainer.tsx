import React from 'react';
import { AbsoluteFill } from 'remotion';
import { colors } from '../design';

export const SlideContainer: React.FC<{
  children: React.ReactNode;
  width?: number;
  height?: number;
}> = ({ children }) => {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bgLight} 50%, ${colors.bg} 100%)`,
        overflow: 'hidden',
      }}
    >
      {/* Top accent bar */}
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

      {/* Subtle grid */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.03,
        }}
      >
        {Array.from({ length: 40 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={`${i * 2.5}%`}
            y1="0"
            x2={`${i * 2.5}%`}
            y2="100%"
            stroke="white"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: 30 }, (_, i) => (
          <line
            key={`h${i}`}
            x1="0"
            y1={`${i * 3.33}%`}
            x2="100%"
            y2={`${i * 3.33}%`}
            stroke="white"
            strokeWidth="1"
          />
        ))}
      </svg>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
