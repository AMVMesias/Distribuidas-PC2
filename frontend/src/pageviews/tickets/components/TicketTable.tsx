import { Eye, XCircle } from 'lucide-react';
import { Ticket } from '@/entities/parking/model/parking.types';
import { StatusBadge } from '@/shared/components/StatusBadge';

export function TicketTable({ tickets, operational, pay, cancel, inspect }: {
  tickets: Ticket[]; operational: boolean; pay: (ticket: Ticket) => void;
  cancel: (ticket: Ticket) => void; inspect: (ticket: Ticket) => void;
}) {
  return (
    <div className="surface-card overflow-x-auto">
      <table className="data-table">
        <thead><tr><th>Ticket</th><th>Vehículo</th><th>Ingreso</th><th>Estado</th><th>Valor</th><th><span className="sr-only">Acciones</span></th></tr></thead>
        <tbody>
          {tickets.map(ticket => (
            <tr
              key={ticket.id}
              onClick={() => inspect(ticket)}
              className="interactive-tr"
              title="Haz clic para inspeccionar el detalle del ticket"
            >
              <td><p className="font-semibold text-[var(--brand)]">{ticket.codigo}</p><p className="mt-1 font-mono text-xs" style={{ color: 'var(--muted)' }}>{ticket.id.slice(0, 8)}</p></td>
              <td><p className="font-mono font-semibold">{ticket.placaVehiculo}</p><p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{ticket.tipoVehiculo}</p></td>
              <td>{new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ticket.fechaHoraIngreso))}</td>
              <td><StatusBadge status={ticket.estado} /></td>
              <td className="font-semibold">${Number(ticket.valorRecaudado).toFixed(2)}</td>
              <td onClick={e => e.stopPropagation()}>
                <div className="flex justify-end gap-2">
                  <button onClick={() => inspect(ticket)} className="grid size-9 place-items-center rounded-lg border hover:bg-[var(--surface-soft)] transition-colors" aria-label="Ver detalle" title="Ver detalle"><Eye size={16} /></button>
                  {operational && ticket.estado === 'ACTIVO' && <>
                    <button onClick={() => pay(ticket)} className="rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">Cobrar</button>
                    <button onClick={() => cancel(ticket)} className="grid size-9 place-items-center rounded-lg border text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" aria-label="Cancelar ticket" title="Cancelar ticket"><XCircle size={16} /></button>
                  </>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
