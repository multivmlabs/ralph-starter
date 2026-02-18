import React from 'react';
import { colors } from '../design';

export const Logo: React.FC<{ size?: number }> = ({ size = 24 }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 700,
          fontSize: size,
          color: colors.accent,
        }}
      >
        ralph-starter
      </span>
      <span
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: size * 0.7,
          color: colors.textDim,
        }}
      >
        ralphstarter.ai
      </span>
    </div>
  );
};
