import { ArrowRight } from 'lucide-react';
import { Brand } from '@/shared/components/Brand';
import { LocaleLink } from '@/shared/components/LocaleLink';
import { Dictionary } from '@/shared/i18n/types';

export function ClosingSection({ copy }: { copy: Dictionary }) {
  return (
    <>
      <section className="page-shell py-20 sm:py-28">
        <div data-reveal className="relative grid overflow-hidden rounded-[2rem] border bg-[var(--surface)] lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="relative p-7 sm:p-12 lg:p-16">
            <p className="eyebrow">Tu cuenta te espera</p>
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">{copy.cta.title}</h2>
            <p className="mt-5 max-w-xl text-lg" style={{ color: 'var(--muted)' }}>{copy.cta.copy}</p>
          </div>
          <div className="flex flex-col gap-3 border-t p-7 sm:flex-row sm:p-12 lg:border-l lg:border-t-0 lg:p-16">
            <LocaleLink href="/registro" className="primary-button">{copy.cta.primary}<ArrowRight size={17} /></LocaleLink>
            <LocaleLink href="/login" className="secondary-button">{copy.cta.secondary}</LocaleLink>
          </div>
        </div>
      </section>
      <footer className="border-t bg-[var(--surface)] py-12">
        <div className="page-shell grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_0.7fr]">
          <section>
            <Brand />
            <p className="mt-5 max-w-sm text-sm leading-6 text-[var(--muted)]">Una experiencia clara para registrar vehículos, gestionar ingresos y consultar tickets.</p>
          </section>
          <nav aria-label="Enlaces del sitio">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Explorar</p>
            <div className="mt-4 grid gap-3 text-sm">
              <a href="#como-funciona">Cómo funciona</a>
              <a href="#beneficios">Beneficios</a>
              <a href="#roles">Sedes</a>
            </div>
          </nav>
          <nav aria-label="Acceso a la plataforma">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Tu cuenta</p>
            <div className="mt-4 grid gap-3 text-sm">
              <LocaleLink href="/login">Iniciar sesión</LocaleLink>
              <LocaleLink href="/registro">Crear cuenta</LocaleLink>
            </div>
          </nav>
        </div>
        <p className="page-shell mt-12 border-t pt-6 text-xs text-[var(--muted)]">© 2026 Nexo Park · Proyecto de sistemas distribuidos</p>
      </footer>
    </>
  );
}
