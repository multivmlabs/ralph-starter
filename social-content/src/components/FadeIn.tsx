import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'none';
}> = ({ children, delay = 0, duration = 15, direction = 'up' }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const translateY =
    direction === 'none'
      ? 0
      : interpolate(frame - delay, [0, duration], [direction === 'up' ? 30 : -30, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {children}
    </div>
  );
};
