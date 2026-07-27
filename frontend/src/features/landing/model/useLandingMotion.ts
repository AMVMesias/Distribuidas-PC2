'use client';

import { RefObject, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function useLandingMotion(scope: RefObject<HTMLElement | null>) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !scope.current) return;

    const context = gsap.context(() => {
      gsap.from('[data-hero-copy] > *', {
        opacity: 0, y: 32, duration: 0.85, stagger: 0.09, ease: 'power3.out',
      });
      gsap.from('[data-hero-visual]', {
        opacity: 0, x: 45, duration: 1.1, ease: 'power3.out',
      });
      gsap.to('[data-hero-image]', {
        yPercent: 7, scale: 1.05, ease: 'none',
        scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: 0.7 },
      });
      gsap.to('[data-marquee]', {
        xPercent: -50, duration: 32, repeat: -1, ease: 'none',
      });
      gsap.to('[data-places-track]', {
        xPercent: -50, duration: 34, repeat: -1, ease: 'none',
      });
      gsap.from('[data-visual-card]', {
        clipPath: 'inset(0 100% 0 0)', duration: 1.1, ease: 'power3.inOut',
        scrollTrigger: { trigger: '[data-visual-card]', start: 'top 82%', once: true },
      });
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(element => {
        gsap.from(element, {
          opacity: 0, y: 42, duration: 0.75, ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 86%', once: true },
        });
      });
    }, scope);

    return () => context.revert();
  }, [scope]);
}
