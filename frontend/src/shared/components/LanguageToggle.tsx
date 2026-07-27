'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import { useI18n } from '@/shared/i18n/I18nContext';

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();

  const toggle = () => {
    const next = locale === 'es' ? 'en' : 'es';
    setLocale(next);
    router.push(pathname.replace(/^\/(es|en)(?=\/|$)/, `/${next}`));
  };

  return (
    <button
      onClick={toggle}
      className="inline-flex h-10 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition hover:-translate-y-0.5"
      aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a español'}
    >
      <Languages size={16} />
      {!compact && locale.toUpperCase()}
    </button>
  );
}
