import React from 'react';
import { Composition, Still } from 'remotion';
import { TwitterThread } from './TwitterThread';
import { LinkedInCarousel } from './LinkedInCarousel';
import { BlogCard } from './BlogCard';
import { tweets } from './data/twitter-thread';
import { slides } from './data/linkedin-carousel';

const SLIDE_DURATION_TWITTER = 100;
const SLIDE_DURATION_LINKEDIN = 150;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TwitterThread"
        component={TwitterThread}
        durationInFrames={tweets.length * SLIDE_DURATION_TWITTER}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="LinkedInCarousel"
        component={LinkedInCarousel}
        durationInFrames={slides.length * SLIDE_DURATION_LINKEDIN}
        fps={30}
        width={1080}
        height={1350}
      />
      <Still
        id="BlogCard"
        component={BlogCard}
        width={1200}
        height={630}
        defaultProps={{
          title: 'Automating Entire Workflows',
          subtitle: 'From specs to PRs on autopilot',
        }}
      />
    </>
  );
};
