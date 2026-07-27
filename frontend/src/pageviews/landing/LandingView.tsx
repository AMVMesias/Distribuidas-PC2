'use client';

import { useRef } from 'react';
import { useI18n } from '@/shared/i18n/I18nContext';
import { useLandingMotion } from '@/features/landing/model/useLandingMotion';
import { LandingHeader } from '@/widgets/LandingHeader/LandingHeader';
import { HeroSection } from '@/pageviews/landing/components/HeroSection';
import { HowSection } from '@/pageviews/landing/components/HowSection';
import { BenefitsSection } from '@/pageviews/landing/components/BenefitsSection';
import { RolesSection } from '@/pageviews/landing/components/RolesSection';
import { ClosingSection } from '@/pageviews/landing/components/ClosingSection';

export function LandingView() {
  const root = useRef<HTMLElement>(null);
  const { dictionary } = useI18n();
  useLandingMotion(root);

  return (
    <main ref={root}>
      <LandingHeader />
      <HeroSection copy={dictionary} />
      <HowSection copy={dictionary} />
      <BenefitsSection copy={dictionary} />
      <RolesSection copy={dictionary} />
      <ClosingSection copy={dictionary} />
    </main>
  );
}
