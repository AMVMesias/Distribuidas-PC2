'use client';

import Image from 'next/image';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Brand } from '@/shared/components/Brand';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { LanguageToggle } from '@/shared/components/LanguageToggle';
import { LocaleLink } from '@/shared/components/LocaleLink';
import { useI18n } from '@/shared/i18n/I18nContext';
import heroImage from '@/shared/assets/smart-parking-hero.png';

export function AuthShell({ children }: { children: React.ReactNode }) {
  const { dictionary } = useI18n();
  return (
    <main className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
      <section className="flex min-h-screen flex-col px-5 py-5 sm:px-10 lg:px-14">
        <header className="flex items-center justify-between">
          <LocaleLink href="/" aria-label="Nexo Park, inicio"><Brand /></LocaleLink>
          <div className="flex gap-2"><LanguageToggle compact /><ThemeToggle /></div>
        </header>
        <div className="mx-auto flex w-full max-w-lg flex-1 items-center py-12">{children}</div>
        <LocaleLink href="/" className="inline-flex w-fit items-center gap-2 text-sm font-medium" style={{ color: 'var(--muted)' }}>
          <ArrowLeft size={16} />{dictionary.auth.back}
        </LocaleLink>
      </section>
      <aside className="relative m-3 hidden overflow-hidden rounded-[2rem] lg:block">
        <Image src={heroImage} alt="" fill priority className="object-cover object-[62%_center]" sizes="55vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">Nexo Park</p>
          <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.04em]">Tu llegada empieza antes de entrar.</h2>
          <ul className="mt-7 grid gap-3 text-sm text-white/80">
            {['Una cuenta para todo el recorrido', 'Flujos específicos para cada rol', 'Información clara en cada paso'].map(item => (
              <li key={item} className="flex items-center gap-3"><CheckCircle2 size={18} className="text-teal-300" />{item}</li>
            ))}
          </ul>
        </div>
      </aside>
    </main>
  );
}
