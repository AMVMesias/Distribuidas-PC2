'use client';

import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/features/auth/model/AuthContext';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { ProfileForm } from '@/features/profile/components/ProfileForm';
import { PasswordForm } from '@/features/profile/components/PasswordForm';

export function ProfileView() {
  const { user, request, refreshUser } = useAuth();
  if (!user) return null;
  const saveProfile = async (body: unknown) => {
    await request('/api/v1/personas/me', { method: 'PUT', body: JSON.stringify(body) });
    await refreshUser();
  };
  const savePassword = async (password: string) => {
    await request<void>('/api/v1/usuarios/me', { method: 'PUT', body: JSON.stringify({ password }) });
  };

  return (
    <>
      <PageHeader eyebrow="Cuenta" title="Mi perfil" description="Mantén actualizados tus datos personales y las credenciales de acceso." />
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="surface-card p-6 sm:p-8"><h2 className="text-xl font-semibold">Información personal</h2><div className="mt-7"><ProfileForm user={user} save={saveProfile} /></div></article>
        <div className="grid content-start gap-6">
          <article className="surface-card p-6"><div className="flex items-center gap-3"><ShieldCheck className="text-[var(--brand)]" /><h2 className="text-xl font-semibold">Seguridad</h2></div><div className="mt-7"><PasswordForm save={savePassword} /></div></article>
          <article className="soft-card p-6"><p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Usuario</p><p className="mt-2 text-xl font-semibold">{user.username}</p><div className="mt-4 flex flex-wrap gap-2">{user.roles.filter(role => role.active).map(role => <StatusBadge key={role.id} status={role.name} />)}</div></article>
        </div>
      </section>
    </>
  );
}
