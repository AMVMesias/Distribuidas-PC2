'use client';

import { useState } from 'react';
import { History, Plus, Trash2 } from 'lucide-react';
import { Assignment, AssignmentAudit, Vehicle } from '@/entities/parking/model/parking.types';
import { User } from '@/entities/user/model/user.types';
import { useAuth } from '@/features/auth/model/AuthContext';
import { useResource } from '@/shared/model/useResource';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState, ErrorNotice, LoadingState } from '@/shared/components/Feedback';
import { Modal } from '@/shared/components/Modal';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { AssignmentForm } from '@/features/assignments/components/AssignmentForm';

export function AssignmentsView() {
  const { request, user, hasRole } = useAuth();
  const assignments = useResource<Assignment[]>('/api/v1/asignaciones', []);
  const vehicles = useResource<Vehicle[]>('/api/v1/vehiculos', []);
  const admin = hasRole('ADMIN', 'ROOT');
  const users = useResource<User[]>('/api/v1/usuarios', [], admin);
  const [modal, setModal] = useState(false);
  const [audit, setAudit] = useState<AssignmentAudit[] | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);

  const create = async (body: unknown) => {
    await request('/api/v1/asignaciones', { method: 'POST', body: JSON.stringify(body) });
    setModal(false); await assignments.reload();
  };
  const remove = async (item: Assignment) => {
    if (!confirm('¿Desactivar esta asignación?')) return;
    await request(`/api/v1/asignaciones/${item.userId}/${item.vehicleId}`, { method: 'DELETE' });
    await assignments.reload();
  };
  const showAudit = async () => {
    setAuditOpen(true);
    setAudit(await request<AssignmentAudit[]>('/api/v1/asignaciones/auditoria'));
  };
  const plate = (id: string) => vehicles.data.find(vehicle => vehicle.id === id)?.placa ?? id.slice(0, 8);
  const owner = (id: string) => {
    if (!admin) return user?.username ?? id.slice(0, 8);
    const found = users.data.find(item => item.idPerson === id);
    return found ? `${found.persona.firstName} ${found.persona.lastName}` : id.slice(0, 8);
  };

  return (
    <>
      <PageHeader eyebrow="Relaciones de propiedad" title="Asignaciones" description={admin ? 'Asocia vehículos a propietarios y consulta el historial de cambios.' : 'Administra la relación entre tu cuenta y tus vehículos.'} actions={<><button className="primary-button min-h-10 px-4" onClick={() => setModal(true)}><Plus size={16} />Nueva asignación</button>{admin && <button className="secondary-button min-h-10 px-4" onClick={showAudit}><History size={16} />Historial</button>}</>} />
      {(assignments.error || vehicles.error || (admin && users.error)) && <ErrorNotice message={assignments.error || vehicles.error || users.error} />}
      {assignments.loading || vehicles.loading ? <LoadingState /> : assignments.data.length ? <div className="surface-card overflow-x-auto"><table className="data-table"><thead><tr><th>Vehículo</th><th>Propietario</th><th>Asignado</th><th>Estado</th><th /></tr></thead><tbody>{assignments.data.map(item => <tr key={`${item.userId}-${item.vehicleId}`}><td className="font-mono font-semibold">{plate(item.vehicleId)}</td><td>{owner(item.userId)}</td><td>{new Date(item.assignedAt).toLocaleDateString()}</td><td><StatusBadge status={item.status} /></td><td><button onClick={() => remove(item)} className="grid size-9 place-items-center rounded-lg border text-red-500" aria-label="Desactivar asignación"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div> : <EmptyState title="No hay asignaciones" copy="Crea una para relacionar un vehículo con su propietario." />}
      <Modal open={modal} close={() => setModal(false)} title="Crear asignación"><AssignmentForm vehicles={vehicles.data} users={admin ? users.data : []} admin={admin} save={create} /></Modal>
      <Modal open={auditOpen} close={() => setAuditOpen(false)} title="Historial de asignaciones">{audit ? <div className="grid gap-3">{audit.map(event => <article key={event.id} className="soft-card p-4"><div className="flex items-center justify-between"><StatusBadge status={event.action} /><time className="text-xs" style={{ color: 'var(--muted)' }}>{new Date(event.timestamp).toLocaleString()}</time></div><p className="mt-3 text-sm">Actor: <strong>{event.actorUsername}</strong></p><p className="mt-1 font-mono text-xs" style={{ color: 'var(--muted)' }}>{plate(event.vehicleId)} · {event.userId.slice(0, 8)}</p></article>)}</div> : <LoadingState />}</Modal>
    </>
  );
}
