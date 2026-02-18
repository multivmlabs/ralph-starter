import React from 'react';
import { Sequence, useCurrentFrame, interpolate } from 'remotion';
import { SlideContainer } from './components/SlideContainer';
import { FadeIn } from './components/FadeIn';
import { Logo } from './components/Logo';
import { SlideCounter } from './components/SlideCounter';
import { tweets } from './data/twitter-thread';
import { colors, fonts } from './design';

const SLIDE_DURATION = 100; // ~3.3 seconds at 30fps

const TwitterSlide: React.FC<{
  headline: string;
  body: string;
  stat?: string;
  slideNumber: number;
  totalSlides: number;
}> = ({ headline, body, stat, slideNumber, totalSlides }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <SlideContainer>
      <div
        style={{
          opacity,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          padding: 80,
        }}
      >
        {/* Header */}
        <FadeIn delay={5} duration={12}>
          <h1
            style={{
              fontFamily: fonts.heading,
              fontSize: 52,
              fontWeight: 800,
              color: colors.accent,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {headline}
          </h1>
        </FadeIn>

        {/* Body */}
        <FadeIn delay={15} duration={15}>
          <p
            style={{
              fontFamily: fonts.heading,
              fontSize: 36,
              fontWeight: 400,
              color: colors.text,
              margin: 0,
              lineHeight: 1.6,
              whiteSpace: 'pre-line',
              maxWidth: '90%',
            }}
          >
            {body}
          </p>
        </FadeIn>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <FadeIn delay={25} duration={10}>
            {stat ? (
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 28,
                  fontWeight: 600,
                  color: colors.accentOrange,
                  padding: '12px 24px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: 12,
                  border: `1px solid rgba(245, 158, 11, 0.2)`,
                }}
              >
                {stat}
              </div>
            ) : (
              <Logo size={22} />
            )}
          </FadeIn>
          <FadeIn delay={20} duration={10}>
            <SlideCounter current={slideNumber} total={totalSlides} />
          </FadeIn>
        </div>
      </div>
    </SlideContainer>
  );
};

export const TwitterThread: React.FC = () => {
  return (
    <>
      {tweets.map((tweet, i) => (
        <Sequence
          key={tweet.slide}
          from={i * SLIDE_DURATION}
          durationInFrames={SLIDE_DURATION}
          name={`Tweet ${tweet.slide}`}
        >
          <TwitterSlide
            headline={tweet.headline}
            body={tweet.body}
            stat={tweet.stat}
            slideNumber={tweet.slide}
            totalSlides={tweets.length}
          />
        </Sequence>
      ))}
    </>
  );
};
