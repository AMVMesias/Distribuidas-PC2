'use client';

import React, { createContext, useContext, useState } from 'react';
import { getDictionary } from '@/shared/i18n/dictionaries';
import { Dictionary, SupportedLocale } from '@/shared/i18n/types';

interface I18nContextType {
  locale: SupportedLocale;
  dictionary: Dictionary;
  setLocale: (locale: SupportedLocale) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ initialLocale?: SupportedLocale; children: React.ReactNode }> = ({
  initialLocale = 'es',
  children,
}) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale);
  const dictionary = getDictionary(locale);

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
  };

  return (
    <I18nContext.Provider value={{ locale, dictionary, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
