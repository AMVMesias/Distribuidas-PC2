import Image from 'next/image';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { LocaleLink } from '@/shared/components/LocaleLink';
import { NexoGlyph } from '@/shared/components/NexoGlyph';
import { Dictionary } from '@/shared/i18n/types';
import heroImage from '@/shared/assets/smart-parking-hero.png';

export function HeroSection({ copy }: { copy: Dictionary }) {
  return (
    <section id="inicio" data-hero className="relative min-h-[100svh] w-full overflow-hidden pt-20">
      <div className="grid lg:min-h-[calc(100svh-8.5rem)] lg:grid-cols-[46%_54%]">
        <article data-hero-copy className="relative z-10 flex flex-col justify-center px-5 py-16 sm:px-8 lg:px-[5vw] lg:py-20">
          <p className="eyebrow mb-6 inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2">
            <span className="size-2 rounded-full bg-[var(--brand)]" />{copy.hero.eyebrow}
          </p>
          <h1 className="text-[clamp(3.35rem,5.4vw,6.6rem)] font-semibold leading-[0.9] tracking-[-0.065em]">
            <span className="block sm:whitespace-nowrap">{copy.hero.titleA}</span>
            <span className="block" style={{ color: 'var(--brand)' }}>{copy.hero.titleAccent}</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 sm:text-lg" style={{ color: 'var(--muted)' }}>{copy.hero.copy}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LocaleLink href="/login" className="primary-button">{copy.hero.primary}<ArrowRight size={17} /></LocaleLink>
            <LocaleLink href="/registro" className="secondary-button">{copy.hero.secondary}</LocaleLink>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium">
            <span className="inline-flex items-center gap-2"><NexoGlyph kind="shield" size={18} className="text-[var(--brand)]" />Acceso por roles</span>
            <span className="inline-flex items-center gap-2"><NexoGlyph kind="data" size={18} className="text-[var(--brand)]" />Información centralizada</span>
          </div>
        </article>
        <div className="relative min-h-[52svh] overflow-hidden lg:min-h-0 lg:overflow-visible" data-hero-visual>
          <div className="hero-visual-mask absolute inset-0">
            <Image
              data-hero-image
              src={heroImage}
              alt="Entrada contemporánea de un parqueadero urbano"
              fill
              priority
              className="object-cover object-[66%_center]"
              sizes="(min-width: 1024px) 62vw, 100vw"
            />
          </div>
          <a href="#como-funciona" className="absolute bottom-7 right-7 flex items-center gap-2 rounded-full bg-[var(--surface)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] lg:bottom-10 lg:right-10">
            Descubrir <ArrowDown size={15} />
          </a>
        </div>
      </div>
      <div className="flex h-14 items-center overflow-hidden border-y bg-[var(--surface)]" aria-hidden="true">
        <p data-marquee className="flex min-w-max items-center gap-10 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">
          Registra <span className="text-[var(--brand)]">●</span> Ingresa <span className="text-[var(--brand)]">●</span> Consulta <span className="text-[var(--brand)]">●</span> Gestiona <span className="text-[var(--brand)]">●</span>
          Registra <span className="text-[var(--brand)]">●</span> Ingresa <span className="text-[var(--brand)]">●</span> Consulta <span className="text-[var(--brand)]">●</span> Gestiona <span className="text-[var(--brand)]">●</span>
        </p>
      </div>
    </section>
  );
}
