'use client';

import Link, { LinkProps } from 'next/link';
import { useI18n } from '@/shared/i18n/I18nContext';

export function LocaleLink({ href, ...props }: LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { locale } = useI18n();
  const localized = typeof href === 'string' && href.startsWith('/') ? `/${locale}${href}` : href;
  return <Link href={localized} {...props} />;
}
