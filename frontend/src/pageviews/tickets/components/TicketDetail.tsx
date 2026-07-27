import { Ticket } from '@/entities/parking/model/parking.types';
import { StatusBadge } from '@/shared/components/StatusBadge';

export function TicketDetail({ ticket }: { ticket: Ticket }) {
  const fields = [
    ['Código', ticket.codigo], ['Placa', ticket.placaVehiculo], ['Estado', <StatusBadge key="status" status={ticket.estado} />],
    ['Ingreso', new Date(ticket.fechaHoraIngreso).toLocaleString()], ['Salida', ticket.fechaHoraSalida ? new Date(ticket.fechaHoraSalida).toLocaleString() : 'Pendiente'],
    ['Tipo de vehículo', ticket.tipoVehiculo], ['Tipo de espacio', ticket.tipoEspacio], ['Valor recaudado', `$${Number(ticket.valorRecaudado).toFixed(2)}`],
  ];
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {fields.map(([label, value]) => <div key={String(label)} className="soft-card p-4"><dt className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{label}</dt><dd className="mt-2 break-words font-medium">{value}</dd></div>)}
    </dl>
  );
}
