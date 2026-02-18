import React from 'react';
import { Sequence, useCurrentFrame, interpolate } from 'remotion';
import { SlideContainer } from './components/SlideContainer';
import { FadeIn } from './components/FadeIn';
import { Logo } from './components/Logo';
import { SlideCounter } from './components/SlideCounter';
import { slides } from './data/linkedin-carousel';
import { colors, fonts } from './design';

const SLIDE_DURATION = 150; // 5 seconds at 30fps

const CarouselSlide: React.FC<{
  headline: string;
  body: string;
  stat?: string;
  slideNumber: number;
  totalSlides: number;
}> = ({ headline, body, stat, slideNumber, totalSlides }) => {
  const frame = useCurrentFrame();

  // Slide-in from right animation
  const translateX = interpolate(frame, [0, 15], [100, 0], {
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <SlideContainer>
      <div
        style={{
          opacity,
          transform: `translateX(${translateX}px)`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          padding: 80,
        }}
      >
        {/* Headline */}
        <div>
          <FadeIn delay={8} duration={12}>
            <h1
              style={{
                fontFamily: fonts.heading,
                fontSize: 56,
                fontWeight: 800,
                color: colors.text,
                margin: 0,
                lineHeight: 1.2,
                whiteSpace: 'pre-line',
              }}
            >
              {headline}
            </h1>
          </FadeIn>

          {/* Accent underline */}
          <FadeIn delay={12} duration={10}>
            <div
              style={{
                width: 80,
                height: 4,
                background: `linear-gradient(to right, ${colors.accent}, ${colors.accentOrange})`,
                marginTop: 24,
                borderRadius: 2,
              }}
            />
          </FadeIn>
        </div>

        {/* Body */}
        <FadeIn delay={20} duration={15}>
          <p
            style={{
              fontFamily: fonts.heading,
              fontSize: 32,
              fontWeight: 400,
              color: colors.textMuted,
              margin: 0,
              lineHeight: 1.8,
              whiteSpace: 'pre-line',
            }}
          >
            {body}
          </p>
        </FadeIn>

        {/* Stat highlight (if present) */}
        {stat && (
          <FadeIn delay={30} duration={10}>
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: 24,
                color: colors.accentOrange,
                padding: '12px 20px',
                background: 'rgba(245, 158, 11, 0.08)',
                borderRadius: 8,
                border: '1px solid rgba(245, 158, 11, 0.15)',
                alignSelf: 'flex-start',
              }}
            >
              {stat}
            </div>
          </FadeIn>
        )}

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Logo size={20} />
          <SlideCounter current={slideNumber} total={totalSlides} />
        </div>
      </div>
    </SlideContainer>
  );
};

export const LinkedInCarousel: React.FC = () => {
  return (
    <>
      {slides.map((slide, i) => (
        <Sequence
          key={i}
          from={i * SLIDE_DURATION}
          durationInFrames={SLIDE_DURATION}
          name={`Slide ${i + 1}`}
        >
          <CarouselSlide
            headline={slide.headline}
            body={slide.body}
            stat={slide.stat}
            slideNumber={i + 1}
            totalSlides={slides.length}
          />
        </Sequence>
      ))}
    </>
  );
};
