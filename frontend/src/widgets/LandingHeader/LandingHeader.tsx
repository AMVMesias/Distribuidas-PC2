'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Menu, X } from 'lucide-react';
import { Brand } from '@/shared/components/Brand';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { LanguageToggle } from '@/shared/components/LanguageToggle';
import { LocaleLink } from '@/shared/components/LocaleLink';
import { useI18n } from '@/shared/i18n/I18nContext';

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const { dictionary } = useI18n();
  const nav = [
    ['#inicio', dictionary.nav.home],
    ['#como-funciona', dictionary.nav.how],
    ['#beneficios', dictionary.nav.benefits],
    ['#roles', dictionary.nav.roles],
  ];

  useEffect(() => {
    const headerElement = header.current;
    const updateHeader = (immediate = false) => {
      if (!headerElement) return;
      const elevated = window.scrollY > 32;
      const side = window.innerWidth >= 640 ? 20 : 12;
      gsap.to(headerElement, {
        top: elevated ? 12 : 0,
        left: elevated ? side : 0,
        right: elevated ? side : 0,
        borderRadius: elevated ? 16 : 0,
        boxShadow: elevated ? '0 12px 42px rgb(15 48 40 / 14%)' : '0 0 0 rgb(15 48 40 / 0%)',
        duration: immediate ? 0 : 0.45,
        ease: 'power3.out',
        overwrite: true,
      });
    };
    const handleScroll = () => updateHeader(false);
    const handleResize = () => updateHeader(true);
    updateHeader(true);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (headerElement) gsap.killTweensOf(headerElement);
    };
  }, []);

  return (
    <header ref={header} className="fixed inset-x-0 top-0 z-50 border backdrop-blur-2xl backdrop-saturate-150 will-change-[top,left,right,border-radius]" style={{ background: 'color-mix(in srgb, var(--surface) 58%, transparent)' }}>
      <nav className="page-shell flex h-16 items-center justify-between" aria-label="Navegación principal">
        <a href="#inicio" aria-label="Nexo Park, inicio"><Brand prominent /></a>
        <div className="hidden items-center gap-7 lg:flex">
          {nav.map(([href, label]) => (
            <a key={href} href={href} className="text-sm font-medium transition hover:text-[var(--brand)]">{label}</a>
          ))}
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <LanguageToggle compact />
          <ThemeToggle />
          <LocaleLink href="/login" className="secondary-button min-h-10 px-5">{dictionary.nav.login}</LocaleLink>
          <LocaleLink href="/registro" className="primary-button min-h-10 px-5">{dictionary.nav.register}</LocaleLink>
        </div>
        <button className="grid size-11 place-items-center rounded-full border sm:hidden" onClick={() => setOpen(value => !value)} aria-label="Abrir navegación" aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div className="page-shell border-t py-5 sm:hidden" style={{ background: 'var(--canvas)' }}>
          <div className="grid gap-2">
            {nav.map(([href, label]) => <a key={href} href={href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 font-medium">{label}</a>)}
            <div className="mt-3 flex items-center gap-2">
              <LanguageToggle /><ThemeToggle />
            </div>
            <LocaleLink href="/login" className="secondary-button mt-2">{dictionary.nav.login}</LocaleLink>
            <LocaleLink href="/registro" className="primary-button">{dictionary.nav.register}</LocaleLink>
          </div>
        </div>
      )}
    </header>
  );
}
