'use client';

import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Vehicle } from '@/entities/parking/model/parking.types';
import { useAuth } from '@/features/auth/model/AuthContext';
import { useResource } from '@/shared/model/useResource';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState, ErrorNotice, LoadingState } from '@/shared/components/Feedback';
import { Modal } from '@/shared/components/Modal';
import { VehicleForm } from '@/features/vehicles/components/VehicleForm';
import { VehicleCard } from '@/pageviews/vehicles/components/VehicleCard';

export function VehiclesView() {
  const { request, hasRole } = useAuth();
  const { data, loading, error, reload } = useResource<Vehicle[]>('/api/v1/vehiculos', []);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(false);
  const canMutate = !hasRole('RECAUDADOR') || hasRole('ADMIN', 'ROOT');
  const filtered = useMemo(() => data.filter(vehicle => `${vehicle.placa} ${vehicle.marca} ${vehicle.modelo}`.toLowerCase().includes(query.toLowerCase())), [data, query]);

  const create = async (body: unknown) => {
    await request('/api/v1/vehiculos', { method: 'POST', body: JSON.stringify(body) });
    setModal(false); await reload();
  };
  const remove = async (vehicle: Vehicle) => {
    if (!confirm(`¿Desactivar el vehículo ${vehicle.placa}?`)) return;
    await request(`/api/v1/vehiculos/${vehicle.id}`, { method: 'DELETE' });
    await reload();
  };

  return (
    <>
      <PageHeader eyebrow={hasRole('CLIENTE') ? 'Tu flota' : 'Consulta operativa'} title="Vehículos" description={hasRole('CLIENTE') ? 'Registra y administra los vehículos asociados a tu cuenta.' : 'Consulta vehículos por placa, marca o modelo.'} actions={canMutate && <button className="primary-button min-h-10 px-4" onClick={() => setModal(true)}><Plus size={16} />Registrar vehículo</button>} />
      <label className="mb-6 flex max-w-lg items-center gap-3 rounded-xl border px-4" style={{ background: 'var(--surface)' }}><Search size={18} style={{ color: 'var(--muted)' }} /><input className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por placa, marca o modelo" /></label>
      {error && <ErrorNotice message={error} />}
      {loading ? <LoadingState /> : <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">{filtered.map(vehicle => <VehicleCard key={vehicle.id} vehicle={vehicle} canDelete={canMutate} remove={() => remove(vehicle)} />)}{!filtered.length && <div className="md:col-span-2 2xl:col-span-3"><EmptyState title="No encontramos vehículos" copy="Prueba otra búsqueda o registra un vehículo." /></div>}</section>}
      <Modal open={modal} close={() => setModal(false)} title="Registrar vehículo" description="Los campos cambian según el tipo seleccionado."><VehicleForm save={create} /></Modal>
    </>
  );
}
