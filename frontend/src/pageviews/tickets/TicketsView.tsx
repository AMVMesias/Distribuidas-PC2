'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Ticket, TicketStatus } from '@/entities/parking/model/parking.types';
import { useAuth } from '@/features/auth/model/AuthContext';
import { useResource } from '@/shared/model/useResource';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState, ErrorNotice, LoadingState } from '@/shared/components/Feedback';
import { Modal } from '@/shared/components/Modal';
import { TicketTable } from '@/pageviews/tickets/components/TicketTable';
import { TicketDetail } from '@/pageviews/tickets/components/TicketDetail';

export function TicketsView() {
  const { request, hasRole } = useAuth();
  const { data, loading, error, reload } = useResource<Ticket[]>('/api/v1/tickets', []);
  const [status, setStatus] = useState<TicketStatus | 'TODOS'>('TODOS');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const operational = hasRole('RECAUDADOR', 'ADMIN', 'ROOT');
  const filtered = useMemo(() => data.filter(ticket =>
    (status === 'TODOS' || ticket.estado === status) &&
    `${ticket.placaVehiculo} ${ticket.codigo}`.toLowerCase().includes(query.toLowerCase())
  ), [data, query, status]);

  const action = async (ticket: Ticket, type: 'pagar' | 'cancelar') => {
    const text = type === 'pagar' ? 'registrar el pago' : 'cancelar el ticket';
    if (!confirm(`¿Confirmas ${text} de ${ticket.codigo}?`)) return;
    await request(`/api/v1/tickets/${ticket.id}/${type}`, { method: 'PATCH' });
    await reload();
  };

  return (
    <>
      <PageHeader eyebrow={operational ? 'Control operativo' : 'Tu historial'} title="Tickets" description={operational ? 'Consulta, cobra o cancela tickets activos desde una vista central.' : 'Revisa tus ingresos, salidas y valores registrados.'} />
      <section className="mb-6 flex flex-col gap-3 sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border px-4" style={{ background: 'var(--surface)' }}><Search size={18} style={{ color: 'var(--muted)' }} /><input className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por placa o código" /></label>
        <select className="field sm:w-48" value={status} onChange={event => setStatus(event.target.value as TicketStatus | 'TODOS')}><option value="TODOS">Todos</option><option>ACTIVO</option><option>PAGADO</option><option>CANCELADO</option></select>
      </section>
      {error && <ErrorNotice message={error} />}
      {loading ? <LoadingState /> : filtered.length ? <TicketTable tickets={filtered} operational={operational} pay={ticket => action(ticket, 'pagar')} cancel={ticket => action(ticket, 'cancelar')} inspect={setSelected} /> : <EmptyState title="No hay tickets para mostrar" copy="Cambia los filtros o espera a que se registre actividad." />}
      <Modal open={Boolean(selected)} close={() => setSelected(null)} title="Detalle del ticket">{selected && <TicketDetail ticket={selected} />}</Modal>
    </>
  );
}
