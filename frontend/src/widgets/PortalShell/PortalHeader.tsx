'use client';

import { LogOut, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { LanguageToggle } from '@/shared/components/LanguageToggle';
import { useAuth } from '@/features/auth/model/AuthContext';
import { useI18n } from '@/shared/i18n/I18nContext';

export function PortalHeader({ openMenu }: { openMenu: () => void }) {
  const { user, logout } = useAuth();
  const { dictionary, locale } = useI18n();
  const router = useRouter();

  const exit = async () => {
    const homeHref = `/${locale}`;
    const loginHref = `/${locale}/login`;
    window.history.replaceState({ ...window.history.state }, '', homeHref);
    await logout();
    window.location.assign(loginHref);
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b px-5 backdrop-blur-xl sm:px-8 lg:px-10" style={{ background: 'color-mix(in srgb, var(--canvas) 86%, transparent)' }}>
      <button className="grid size-10 place-items-center rounded-full border lg:hidden" onClick={openMenu} aria-label={dictionary.portal.menu}><Menu size={19} /></button>
      <div className="hidden lg:block">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Bienvenido de nuevo,</p>
        <p className="font-semibold">{user?.persona.firstName ?? user?.username}</p>
      </div>
      <div className="flex items-center gap-2">
        <LanguageToggle compact />
        <ThemeToggle />
        <button onClick={exit} className="grid size-10 place-items-center rounded-full border text-red-500" aria-label={dictionary.portal.logout}><LogOut size={18} /></button>
      </div>
    </header>
  );
}
