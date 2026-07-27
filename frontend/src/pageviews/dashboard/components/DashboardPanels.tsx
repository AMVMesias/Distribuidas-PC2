import { ArrowRight, Clock3 } from 'lucide-react';
import { DashboardData } from '@/pageviews/dashboard/model/useDashboardData';
import { LocaleLink } from '@/shared/components/LocaleLink';
import { StatusBadge } from '@/shared/components/StatusBadge';

export function DashboardPanels({ data }: { data: DashboardData }) {
  return (
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <article className="surface-card overflow-hidden">
        <header className="flex items-center justify-between border-b p-5 sm:p-6">
          <div><h2 className="text-lg font-semibold">Actividad reciente</h2><p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Últimos tickets disponibles</p></div>
          <LocaleLink href="/portal/tickets" className="text-sm font-semibold text-[var(--brand)]">Ver todos</LocaleLink>
        </header>
        <div className="divide-y">
          {data.tickets.slice(0, 5).map(ticket => (
            <div key={ticket.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: 'var(--surface-soft)', color: 'var(--brand)' }}><Clock3 size={18} /></span>
              <div className="min-w-0 flex-1"><p className="truncate font-semibold">{ticket.placaVehiculo}</p><p className="truncate text-xs" style={{ color: 'var(--muted)' }}>{ticket.codigo}</p></div>
              <StatusBadge status={ticket.estado} />
            </div>
          ))}
          {!data.tickets.length && <p className="p-8 text-center text-sm" style={{ color: 'var(--muted)' }}>Aún no hay actividad para mostrar.</p>}
        </div>
      </article>
      <article className="surface-card p-6">
        <p className="eyebrow">Accesos rápidos</p>
        <h2 className="mt-3 text-2xl font-semibold">Continúa tu trabajo</h2>
        <div className="mt-7 grid gap-3">
          {[['/portal/vehiculos', 'Consultar vehículos'], ['/portal/tickets', 'Revisar tickets'], ['/portal/zonas', 'Explorar zonas']].map(([href, label]) => (
            <LocaleLink key={href} href={href} className="flex items-center justify-between rounded-xl border px-4 py-4 text-sm font-semibold transition hover:border-[var(--brand)]">
              {label}<ArrowRight size={17} />
            </LocaleLink>
          ))}
        </div>
      </article>
    </section>
  );
}
