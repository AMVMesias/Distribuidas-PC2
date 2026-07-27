'use client';

import { useMemo, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { Role, User } from '@/entities/user/model/user.types';
import { useAuth } from '@/features/auth/model/AuthContext';
import { useResource } from '@/shared/model/useResource';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState, ErrorNotice, LoadingState } from '@/shared/components/Feedback';
import { Modal } from '@/shared/components/Modal';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { UserForm } from '@/features/users/components/UserForm';
import { UserDetail } from '@/pageviews/users/components/UserDetail';

export function UsersView() {
  const { request, hasRole } = useAuth();
  const users = useResource<User[]>('/api/v1/usuarios', []);
  const roles = useResource<Role[]>('/api/v1/roles', []);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const allowed = hasRole('ADMIN', 'ROOT');
  const filtered = useMemo(() => users.data.filter(user => `${user.username} ${user.persona.firstName} ${user.persona.lastName} ${user.persona.dni}`.toLowerCase().includes(query.toLowerCase())), [query, users.data]);

  const create = async (body: unknown, roleId: string) => {
    const user = await request<User>('/api/v1/usuarios', { method: 'POST', body: JSON.stringify(body) });
    await request(`/api/v1/usuarios/${user.idPerson}/roles/${roleId}`, { method: 'POST' });
    setCreating(false); await users.reload();
  };
  const roleAction = async (user: User, roleId: string, method: 'POST' | 'DELETE') => {
    await request(`/api/v1/usuarios/${user.idPerson}/roles/${roleId}`, { method });
    const updated = await request<User>(`/api/v1/usuarios/${user.idPerson}`);
    setSelected(updated); await users.reload();
  };
  const deactivate = async (user: User) => {
    if (!confirm(`¿Desactivar a ${user.username}?`)) return;
    await request(`/api/v1/usuarios/${user.idPerson}`, { method: 'DELETE' });
    await users.reload();
  };

  if (!allowed) return <ErrorNotice message="Tu rol no tiene acceso a la administración de usuarios." />;
  return (
    <>
      <PageHeader eyebrow="Administración" title="Usuarios" description="Crea cuentas internas, revisa sus datos y administra los roles asignados." actions={<button className="primary-button min-h-10 px-4" onClick={() => setCreating(true)}><Plus size={16} />Nuevo usuario</button>} />
      <label className="mb-6 flex max-w-lg items-center gap-3 rounded-xl border px-4" style={{ background: 'var(--surface)' }}><Search size={18} /><input className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar usuario, nombre o documento" /></label>
      {(users.error || roles.error) && <ErrorNotice message={users.error || roles.error} />}
      {users.loading || roles.loading ? <LoadingState /> : filtered.length ? <div className="surface-card overflow-x-auto"><table className="data-table"><thead><tr><th>Usuario</th><th>Persona</th><th>Roles</th><th>Estado</th><th /></tr></thead><tbody>{filtered.map(user => <tr key={user.idPerson}><td><button className="font-semibold text-[var(--brand)]" onClick={() => setSelected(user)}>{user.username}</button></td><td><p>{user.persona.firstName} {user.persona.lastName}</p><p className="text-xs" style={{ color: 'var(--muted)' }}>{user.persona.email}</p></td><td><div className="flex flex-wrap gap-1">{user.roles.filter(role => role.active).map(role => <StatusBadge key={role.id} status={role.name} />)}</div></td><td><StatusBadge status={user.active ? 'ACTIVE' : 'INACTIVE'} /></td><td><button onClick={() => deactivate(user)} className="grid size-9 place-items-center rounded-lg border text-red-500" aria-label="Desactivar usuario"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div> : <EmptyState title="No hay usuarios" copy="Prueba otra búsqueda o crea una cuenta." />}
      <Modal open={creating} close={() => setCreating(false)} title="Crear usuario interno"><UserForm roles={roles.data} save={create} /></Modal>
      <Modal open={Boolean(selected)} close={() => setSelected(null)} title={selected ? `${selected.persona.firstName} ${selected.persona.lastName}` : 'Usuario'}>{selected && <UserDetail user={selected} roles={roles.data} assign={id => roleAction(selected, id, 'POST')} remove={id => roleAction(selected, id, 'DELETE')} />}</Modal>
    </>
  );
}
