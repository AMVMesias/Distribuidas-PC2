'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/model/AuthContext';
import { useI18n } from '@/shared/i18n/I18nContext';
import { PortalSidebar } from '@/widgets/PortalShell/PortalSidebar';
import { PortalHeader } from '@/widgets/PortalShell/PortalHeader';

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const { locale } = useI18n();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) router.replace(`/${locale}/login`);
  }, [loading, locale, router, session]);

  if (loading || !session) {
    return <main className="grid min-h-screen place-items-center"><LoaderCircle className="animate-spin text-[var(--brand)]" size={30} /></main>;
  }

  return (
    <div className="min-h-screen">
      <PortalSidebar open={menuOpen} close={() => setMenuOpen(false)} />
      <div className="lg:pl-[286px]">
        <PortalHeader openMenu={() => setMenuOpen(true)} />
        <main className="px-5 py-7 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
