'use client';

import { FormEvent, useState } from 'react';
import { KeyRound, Plus, Trash2 } from 'lucide-react';
import { Role } from '@/entities/user/model/user.types';
import { useAuth } from '@/features/auth/model/AuthContext';
import { useResource } from '@/shared/model/useResource';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState, ErrorNotice, LoadingState } from '@/shared/components/Feedback';
import { Modal } from '@/shared/components/Modal';
import { FormField } from '@/features/auth/components/FormField';
import { StatusBadge } from '@/shared/components/StatusBadge';

export function RolesView() {
  const { request, hasRole } = useAuth();
  const roles = useResource<Role[]>('/api/v1/roles', []);
  const [modal, setModal] = useState(false);
  const [actionError, setActionError] = useState('');
  const allowed = hasRole('ADMIN', 'ROOT');

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setActionError('');
    try {
      await request('/api/v1/roles', { method: 'POST', body: JSON.stringify({ name: String(data.name).toUpperCase(), description: data.description }) });
      setModal(false); await roles.reload();
    } catch (reason) { setActionError(reason instanceof Error ? reason.message : 'No se pudo crear el rol.'); }
  };
  const remove = async (role: Role) => {
    if (!confirm(`¿Desactivar el rol ${role.name}?`)) return;
    await request(`/api/v1/roles/${role.id}`, { method: 'DELETE' });
    await roles.reload();
  };

  if (!allowed) return <ErrorNotice message="Tu rol no tiene acceso a la administración de roles." />;
  return (
    <>
      <PageHeader eyebrow="Control de acceso" title="Roles" description="Administra las categorías de permisos disponibles para las cuentas del sistema." actions={<button className="primary-button min-h-10 px-4" onClick={() => setModal(true)}><Plus size={16} />Nuevo rol</button>} />
      {roles.error && <ErrorNotice message={roles.error} />}
      {roles.loading ? <LoadingState /> : roles.data.length ? <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{roles.data.map(role => <article key={role.id} className="surface-card p-6"><div className="flex items-start justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-[var(--surface-soft)] text-[var(--brand)]"><KeyRound /></span><StatusBadge status={role.active ? 'ACTIVE' : 'INACTIVE'} /></div><h2 className="mt-7 text-xl font-semibold">{role.name}</h2><p className="mt-2 min-h-12 text-sm leading-6" style={{ color: 'var(--muted)' }}>{role.description}</p><button className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-red-500" onClick={() => remove(role)}><Trash2 size={16} />Desactivar</button></article>)}</section> : <EmptyState title="No hay roles" copy="Crea un rol para comenzar." />}
      <Modal open={modal} close={() => setModal(false)} title="Crear rol" description="Usa un nombre corto y una descripción clara.">
        <form className="grid gap-4" onSubmit={create}><FormField id="role-name" name="name" label="Nombre" maxLength={50} required /><FormField id="role-description" name="description" label="Descripción" maxLength={500} />{actionError && <ErrorNotice message={actionError} />}<button className="primary-button">Guardar rol</button></form>
      </Modal>
    </>
  );
}
