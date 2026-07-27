import { CarFront, CircleParking, TicketCheck, UsersRound } from 'lucide-react';
import { DashboardData } from '@/pageviews/dashboard/model/useDashboardData';

export function StatCards({ data, admin }: { data: DashboardData; admin: boolean }) {
  const available = data.zones.flatMap(zone => zone.espacios ?? []).filter(space => space.estado === 'DISPONIBLE').length;
  const activeTickets = data.tickets.filter(ticket => ticket.estado === 'ACTIVO').length;
  const stats = [
    { label: 'Vehículos', value: data.vehicles.length, icon: CarFront },
    { label: 'Tickets activos', value: activeTickets, icon: TicketCheck },
    { label: 'Espacios disponibles', value: available, icon: CircleParking },
    ...(admin ? [{ label: 'Usuarios', value: data.users.length, icon: UsersRound }] : []),
  ];

  return (
    <section className={`grid gap-4 sm:grid-cols-2 ${admin ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
      {stats.map(({ label, value, icon: Icon }) => (
        <article key={label} className="surface-card p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>{label}</p>
            <span className="grid size-10 place-items-center rounded-xl" style={{ background: 'var(--surface-soft)', color: 'var(--brand)' }}><Icon size={19} /></span>
          </div>
          <p className="mt-7 text-4xl font-semibold tracking-[-0.05em]">{value}</p>
        </article>
      ))}
    </section>
  );
}
