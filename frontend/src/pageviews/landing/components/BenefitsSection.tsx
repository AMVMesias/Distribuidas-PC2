'use client';

import Image from 'next/image';
import gsap from 'gsap';
import { Dictionary } from '@/shared/i18n/types';
import { NexoGlyph, type NexoGlyphKind } from '@/shared/components/NexoGlyph';
import benefitsVisual from '@/shared/assets/benefits-visual-strip.png';

const icons: NexoGlyphKind[] = ['shield', 'speed', 'data', 'devices'];
const descriptions = [
  'Permisos claros para cada cuenta.',
  'Menos pasos en cada operación.',
  'Un mismo estado en toda la plataforma.',
  'Diseñada para cualquier pantalla.',
];
const markerPositions = ['left-[13%]', 'left-[38%]', 'left-[63%]', 'left-[87%]'];

function animateBenefit(element: HTMLElement, index: number, active: boolean) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.to(element, { y: active ? -6 : 0, duration: 0.3, ease: 'power2.out' });
  gsap.to('[data-benefit-progress]', {
    scaleX: active ? index / 3 : 0, duration: 0.55, ease: 'power3.inOut',
  });
  document.querySelectorAll<HTMLElement>('[data-benefit-marker]').forEach(marker => {
    const completed = active && Number(marker.dataset.benefitMarker) <= index;
    gsap.to(marker, {
      scale: completed ? 1.18 : 1, backgroundColor: completed ? '#18a999' : '#ffffff',
      color: completed ? '#ffffff' : '#0f766e', duration: 0.3,
    });
  });
}

export function BenefitsSection({ copy }: { copy: Dictionary }) {
  return (
    <section id="beneficios" className="page-shell pb-24 sm:pb-32">
      <header data-reveal className="grid items-end gap-7 border-b pb-10 lg:grid-cols-[1fr_0.7fr]">
        <div>
          <p className="eyebrow">{copy.benefits.eyebrow}</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">{copy.benefits.title}</h2>
        </div>
        <p className="max-w-xl leading-7 text-[var(--muted)] lg:justify-self-end">{copy.benefits.copy}</p>
      </header>
      <figure data-reveal className="relative mt-10 min-h-[42rem] overflow-hidden rounded-[2.5rem] border bg-[#d9d4c4] sm:min-h-[46rem] lg:min-h-0 lg:aspect-[16/8]">
        <Image src={benefitsVisual} alt="Seguridad, velocidad, información y adaptación representadas en una sola escena" fill className="object-cover object-center" sizes="90vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#10201c]/75 via-transparent to-transparent" aria-hidden="true" />
        <span className="absolute left-[13%] right-[13%] top-[44%] hidden h-1 rounded-full bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.55)] lg:block" aria-hidden="true">
          <span data-benefit-progress className="block h-full origin-left scale-x-0 bg-[var(--brand-bright)]" />
        </span>
        {copy.benefits.items.map((item, index) => {
          return (
            <span key={item} data-benefit-marker={index} className={`absolute top-[44%] hidden size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-white text-[var(--brand)] shadow-[0_5px_24px_rgba(15,48,40,0.22)] lg:grid ${markerPositions[index]}`}>
              <NexoGlyph kind={icons[index]} size={24} />
            </span>
          );
        })}
        <figcaption className="absolute inset-x-4 bottom-4 grid gap-2 sm:inset-x-6 sm:bottom-6 sm:grid-cols-2 lg:grid-cols-4">
          {copy.benefits.items.map((item, index) => {
            return (
              <article
                key={item}
                className="rounded-[1.35rem] border border-white/25 bg-[#10201c]/80 p-5 text-white backdrop-blur-md"
                onMouseEnter={event => animateBenefit(event.currentTarget, index, true)}
                onMouseLeave={event => animateBenefit(event.currentTarget, index, false)}
              >
                <div className="flex items-center gap-3">
                  <NexoGlyph kind={icons[index]} size={21} className="text-[var(--brand-bright)]" />
                  <h3 className="font-semibold">{item}</h3>
                </div>
                <p className="mt-3 text-sm leading-5 text-white/65">{descriptions[index]}</p>
              </article>
            );
          })}
        </figcaption>
      </figure>
    </section>
  );
}
