'use client';

import Image, { StaticImageData } from 'next/image';
import { MapPin, Plus } from 'lucide-react';
import { Ticket, Zone } from '@/entities/parking/model/parking.types';
import { StatusBadge } from '@/shared/components/StatusBadge';
import centralImage from '@/shared/assets/place-central.png';
import alamedaImage from '@/shared/assets/place-alameda.png';
import riberaImage from '@/shared/assets/place-ribera.png';

function zoneImage(zone: Zone): StaticImageData {
  if (zone.tipo === 'PREFERENCIAL' || zone.nombre.toLowerCase().includes('centro')) return centralImage;
  if (zone.tipo === 'EXTERNA' || zone.nombre.toLowerCase().includes('sur')) return alamedaImage;
  return riberaImage;
}

export function ZoneCard({ zone, canEdit, addSpace, changeStatus, ticketMap }: {
  zone: Zone; canEdit: boolean; addSpace: () => void;
  changeStatus: (spaceId: string, status: string) => void;
  ticketMap?: Map<string, Ticket>;
}) {
  const spaces = zone.espacios ?? [];
  const available = spaces.filter(space => space.estado === 'DISPONIBLE').length;
  return (
    <article className="surface-card overflow-hidden">
      <div className="relative min-h-48 overflow-hidden sm:min-h-56">
        <Image
          src={zoneImage(zone)}
          alt={`Acceso de ${zone.nombre}`}
          fill
          sizes="(max-width: 1280px) 100vw, 1200px"
          className="object-cover transition duration-700 hover:scale-[1.025]"
          placeholder="blur"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/30 bg-black/35 px-3 py-2 text-sm font-semibold text-white backdrop-blur-md sm:left-6">
          <span className="size-2 rounded-full bg-emerald-400" />
          {available} de {spaces.length} espacios disponibles
        </div>
      </div>
      <header className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl" style={{ background: 'var(--surface-soft)', color: 'var(--brand)' }}><MapPin /></span>
          <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">{zone.nombre}</h2><StatusBadge status={zone.tipo} /></div><p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{zone.descripcion || zone.codigo}</p></div>
        </div>
        {canEdit && <button className="secondary-button min-h-10 px-4" onClick={addSpace}><Plus size={16} />Añadir espacio</button>}
      </header>
      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
        {spaces.map(space => {
          const activeTicket = canEdit ? (ticketMap?.get(space.id) ?? ticketMap?.get(space.codigo)) : undefined;
          return (
            <section key={space.id} className="soft-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{space.codigo}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{space.tipo} · Cap. {space.capacidad}</p>
                  {activeTicket && (
                    <div className="mt-2 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-500/20">
                      🚗 {activeTicket.placaVehiculo}
                      <p className="text-[10px] font-normal opacity-80">{activeTicket.codigo}</p>
                    </div>
                  )}
                </div>
                <StatusBadge status={space.estado} />
              </div>
              {canEdit && (
                <select className="field mt-4 min-h-10 text-xs" value={space.estado} onChange={event => changeStatus(space.id, event.target.value)} aria-label={`Estado de ${space.codigo}`}>
                  <option>DISPONIBLE</option><option>RESERVADO</option><option>FUERA_DE_SERVICIO</option><option>OCUPADO</option>
                </select>
              )}
            </section>
          );
        })}
        {!spaces.length && <p className="py-5 text-sm" style={{ color: 'var(--muted)' }}>Esta zona todavía no tiene espacios registrados.</p>}
      </div>
    </article>
  );
}
