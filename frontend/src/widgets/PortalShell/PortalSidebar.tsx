'use client';

import { X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Brand } from '@/shared/components/Brand';
import { LocaleLink } from '@/shared/components/LocaleLink';
import { useAuth } from '@/features/auth/model/AuthContext';
import { useI18n } from '@/shared/i18n/I18nContext';
import { portalNavigation } from '@/widgets/PortalShell/portalNavigation';

export function PortalSidebar({ open, close }: { open: boolean; close: () => void }) {
  const pathname = usePathname();
  const { roles } = useAuth();
  const { dictionary } = useI18n();
  const allowed = portalNavigation.filter(item => !item.roles || item.roles.some(role => roles.includes(role)));

  return (
    <>
      {open && <button className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={close} aria-label="Cerrar menú" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[286px] flex-col border-r p-5 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`} style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between">
          <Brand />
          <button className="grid size-10 place-items-center rounded-full border lg:hidden" onClick={close} aria-label="Cerrar menú"><X size={18} /></button>
        </div>
        <nav className="mt-10 grid gap-1" aria-label="Portal">
          {allowed.map(item => {
            const href = item.slug ? `/portal/${item.slug}` : '/portal';
            const localizedEnd = item.slug ? pathname.endsWith(`/${item.slug}`) : /\/portal\/?$/.test(pathname);
            const Icon = item.icon;
            return (
              <LocaleLink
                key={item.labelKey}
                href={href}
                onClick={close}
                className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition"
                style={localizedEnd ? { background: 'var(--surface-soft)', color: 'var(--brand)' } : { color: 'var(--muted)' }}
              >
                <Icon size={19} />{dictionary.portal[item.labelKey]}
              </LocaleLink>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl p-4" style={{ background: 'var(--surface-soft)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Sesión activa</p>
          <p className="mt-2 truncate text-sm font-semibold">{roles.join(' · ')}</p>
        </div>
      </aside>
    </>
  );
}
