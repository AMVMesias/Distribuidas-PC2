'use client';

import React from 'react';
import { useI18n } from '@/shared/i18n/I18nContext';

export const HomeView: React.FC = () => {
  const { dictionary, locale, setLocale } = useI18n();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <section className="max-w-2xl text-center space-y-6">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">{dictionary.common.welcome}</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">{dictionary.common.description}</p>
        </header>

        <nav className="flex justify-center gap-4">
          <button
            onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Idioma / Language: {locale.toUpperCase()}
          </button>
        </nav>
      </section>
    </main>
  );
};
