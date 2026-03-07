import type { ReactNode } from 'react';
import { useEffect } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HeroSection from '@site/src/components/HeroSection';
import FigmaShowcase from '@site/src/components/FigmaShowcase';
import VisualValidation from '@site/src/components/VisualValidation';
import FeatureSections from '@site/src/components/FeatureSections';
import AutoMode from '@site/src/components/AutoMode';
import QuickStart from '@site/src/components/QuickStart';
import PresetsShowcase from '@site/src/components/PresetsShowcase';
import SkillsShowcase from '@site/src/components/SkillsShowcase';
import UseCases from '@site/src/components/UseCases';
import AgentEcosystem from '@site/src/components/AgentEcosystem';
import IntegrationShowcase from '@site/src/components/IntegrationShowcase';

export default function Home(): ReactNode {
  useDocusaurusContext();

  // Add homepage class for special navbar styling
  useEffect(() => {
    document.documentElement.classList.add('homepage');
    return () => {
      document.documentElement.classList.remove('homepage');
    };
  }, []);

  return (
    <Layout
      title="Home"
      description="AI-powered autonomous coding from specs to production. Connect Figma, GitHub, Linear, and Notion to run AI coding loops with visual validation.">
      <HeroSection />
      <main>
        <FigmaShowcase />
        <VisualValidation />
        <FeatureSections />
        <AutoMode />
        <QuickStart />
        <PresetsShowcase />
        <SkillsShowcase />
        <UseCases />
        <AgentEcosystem />
        <IntegrationShowcase />
      </main>
    </Layout>
  );
}
