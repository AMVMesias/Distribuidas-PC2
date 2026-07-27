'use client';

import { useEffect } from 'react';
import { SupportedLocale } from '@/shared/i18n/types';

export function LocaleDocumentSync({ locale }: { locale: SupportedLocale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
