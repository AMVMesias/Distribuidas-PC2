'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, CircleParking, TicketCheck } from 'lucide-react';
import { Ticket, Zone } from '@/entities/parking/model/parking.types';
import { useAuth } from '@/features/auth/model/AuthContext';
import { useResource } from '@/shared/model/useResource';
import { PageHeader } from '@/shared/components/PageHeader';
import { ErrorNotice, LoadingState } from '@/shared/components/Feedback';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { EntryForm } from '@/features/operation/components/EntryForm';
import { SseBadge } from '@/shared/components/SseBadge';

export function OperationView() {
  const { request, hasRole } = useAuth();
  const zones = useResource<Zone[]>('/api/v1/zonas', []);
  const tickets = useResource<Ticket[]>('/api/v1/tickets?estado=ACTIVO', []);
  const [message, setMessage] = useState('');
  const allowed = hasRole('RECAUDADOR', 'ADMIN', 'ROOT');
  const spaces = useMemo(() => zones.data.flatMap(zone => zone.espacios ?? []).filter(space => space.estado === 'DISPONIBLE' && space.activo), [zones.data]);

  const reloadAll = () => {
    zones.reload();
    tickets.reload();
  };

  const create = async (body: unknown) => {
    const ticket = await request<Ticket>('/api/v1/tickets', { method: 'POST', body: JSON.stringify(body) });
    setMessage(`Entrada registrada: ${ticket.codigo}`);
    await Promise.all([zones.reload(), tickets.reload()]);
  };
  const pay = async (ticket: Ticket) => {
    if (!confirm(`¿Registrar salida y cobro de ${ticket.placaVehiculo}?`)) return;
    const updated = await request<Ticket>(`/api/v1/tickets/${ticket.id}/pagar`, { method: 'PATCH' });
    setMessage(`Salida registrada por $${Number(updated.valorRecaudado).toFixed(2)}`);
    await Promise.all([zones.reload(), tickets.reload()]);
  };

  if (!allowed) return <ErrorNotice message="Tu rol no tiene acceso al módulo operativo." />;
  return (
    <>
      <PageHeader
        eyebrow="Turno operativo"
        title="Entradas y salidas"
        description="Registra el ingreso por placa y procesa la salida desde la misma superficie de trabajo."
        actions={<SseBadge onEvent={reloadAll} />}
      />
      {message && <p role="status" className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><CheckCircle2 size={18} />{message}</p>}
      {(zones.error || tickets.error) && <ErrorNotice message={zones.error || tickets.error} />}
      {zones.loading || tickets.loading ? <LoadingState /> : (
        <section className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
          <article className="surface-card p-6">
            <div className="mb-7 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-[var(--surface-soft)] text-[var(--brand)]"><CircleParking /></span><div><h2 className="font-semibold">Registrar entrada</h2><p className="text-xs" style={{ color: 'var(--muted)' }}>{spaces.length} espacios disponibles</p></div></div>
            <EntryForm spaces={spaces} submit={create} />
          </article>
          <article className="surface-card overflow-hidden">
            <header className="flex items-center gap-3 border-b p-6"><TicketCheck className="text-[var(--brand)]" /><div><h2 className="font-semibold">Vehículos dentro</h2><p className="text-xs" style={{ color: 'var(--muted)' }}>Tickets activos para procesar salida</p></div></header>
            <div className="divide-y">{tickets.data.map(ticket => <div key={ticket.id} className="flex flex-wrap items-center gap-4 px-6 py-4"><div className="min-w-32 flex-1"><p className="font-mono text-lg font-semibold">{ticket.placaVehiculo}</p><p className="text-xs" style={{ color: 'var(--muted)' }}>{ticket.codigo}</p></div><StatusBadge status={ticket.estado} /><button className="primary-button min-h-10 px-4" onClick={() => pay(ticket)}>Registrar salida</button></div>)}{!tickets.data.length && <p className="p-8 text-center text-sm" style={{ color: 'var(--muted)' }}>No hay tickets activos.</p>}</div>
          </article>
        </section>
      )}
    </>
  );
}
