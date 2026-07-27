import { notFound } from 'next/navigation';
import { I18nProvider } from '@/shared/i18n/I18nContext';
import { SupportedLocale } from '@/shared/i18n/types';
import { LocaleDocumentSync } from '@/shared/i18n/LocaleDocumentSync';

const locales: SupportedLocale[] = ['es', 'en'];

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as SupportedLocale)) notFound();
  return (
    <I18nProvider initialLocale={locale as SupportedLocale}>
      <LocaleDocumentSync locale={locale as SupportedLocale} />
      {children}
    </I18nProvider>
  );
}
