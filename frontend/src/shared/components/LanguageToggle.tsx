'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useI18n } from '@/shared/i18n/I18nContext';
import { SupportedLocale } from '@/shared/i18n/types';

const LANGUAGES: { code: SupportedLocale; label: string; flag: string }[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const current = LANGUAGES.find(l => l.code === locale) || LANGUAGES[0];

  const changeLocale = (next: SupportedLocale) => {
    setLocale(next);
    setOpen(false);
    router.push(pathname.replace(/^\/(es|en)(?=\/|$)/, `/${next}`));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 text-xs font-semibold transition hover:bg-[var(--surface-hover)] focus:outline-none"
        aria-label="Seleccionar idioma"
        aria-expanded={open}
      >
        <Globe size={15} className="text-[var(--brand)]" />
        <span>{compact ? current.code.toUpperCase() : current.label}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          {LANGUAGES.map(lang => {
            const selected = lang.code === locale;
            return (
              <button
                key={lang.code}
                onClick={() => changeLocale(lang.code)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
                  selected ? 'bg-[var(--brand)] text-white' : 'hover:bg-[var(--surface-hover)]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </span>
                {selected && <Check size={14} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
