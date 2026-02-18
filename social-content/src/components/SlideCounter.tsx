import React from 'react';
import { colors } from '../design';

export const SlideCounter: React.FC<{
  current: number;
  total: number;
}> = ({ current, total }) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: i === current - 1 ? 24 : 8,
            height: 8,
            borderRadius: 4,
            background: i === current - 1 ? colors.accent : colors.textDim,
            transition: 'all 0.3s',
          }}
        />
      ))}
    </div>
  );
};
