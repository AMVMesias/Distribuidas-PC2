import { CarFront, Trash2 } from 'lucide-react';
import { Vehicle } from '@/entities/parking/model/parking.types';
import { StatusBadge } from '@/shared/components/StatusBadge';

export function VehicleCard({ vehicle, canDelete, remove }: { vehicle: Vehicle; canDelete: boolean; remove: () => void }) {
  return (
    <article className="surface-card p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <span className="grid size-12 place-items-center rounded-2xl" style={{ background: 'var(--surface-soft)', color: 'var(--brand)' }}><CarFront /></span>
        <StatusBadge status={vehicle.clasificacion} />
      </div>
      <p className="mt-7 font-mono text-2xl font-semibold tracking-tight">{vehicle.placa}</p>
      <p className="mt-2 font-medium">{vehicle.marca} {vehicle.modelo}</p>
      <dl className="mt-5 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
        <div><dt style={{ color: 'var(--muted)' }}>Tipo</dt><dd className="mt-1 capitalize">{vehicle.tipo}</dd></div>
        <div><dt style={{ color: 'var(--muted)' }}>Año</dt><dd className="mt-1">{vehicle.anio}</dd></div>
        <div><dt style={{ color: 'var(--muted)' }}>Color</dt><dd className="mt-1">{vehicle.color}</dd></div>
        <div><dt style={{ color: 'var(--muted)' }}>ID</dt><dd className="mt-1 truncate font-mono text-xs">{vehicle.id.slice(0, 8)}</dd></div>
      </dl>
      {canDelete && <button onClick={remove} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-red-500"><Trash2 size={16} />Desactivar vehículo</button>}
    </article>
  );
}
