import { MapPin, Plus } from 'lucide-react';
import { Zone } from '@/entities/parking/model/parking.types';
import { StatusBadge } from '@/shared/components/StatusBadge';

export function ZoneCard({ zone, canEdit, addSpace, changeStatus }: {
  zone: Zone; canEdit: boolean; addSpace: () => void;
  changeStatus: (spaceId: string, status: string) => void;
}) {
  const spaces = zone.espacios ?? [];
  return (
    <article className="surface-card overflow-hidden">
      <header className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl" style={{ background: 'var(--surface-soft)', color: 'var(--brand)' }}><MapPin /></span>
          <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">{zone.nombre}</h2><StatusBadge status={zone.tipo} /></div><p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{zone.descripcion || zone.codigo}</p></div>
        </div>
        {canEdit && <button className="secondary-button min-h-10 px-4" onClick={addSpace}><Plus size={16} />Añadir espacio</button>}
      </header>
      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
        {spaces.map(space => (
          <section key={space.id} className="soft-card p-4">
            <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{space.codigo}</p><p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{space.tipo} · Cap. {space.capacidad}</p></div><StatusBadge status={space.estado} /></div>
            {canEdit && (
              <select className="field mt-4 min-h-10 text-xs" value={space.estado} onChange={event => changeStatus(space.id, event.target.value)} aria-label={`Estado de ${space.codigo}`}>
                <option>DISPONIBLE</option><option>RESERVADO</option><option>FUERA_DE_SERVICIO</option><option>OCUPADO</option>
              </select>
            )}
          </section>
        ))}
        {!spaces.length && <p className="py-5 text-sm" style={{ color: 'var(--muted)' }}>Esta zona todavía no tiene espacios registrados.</p>}
      </div>
    </article>
  );
}
