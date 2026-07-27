'use client';

import { FormEvent, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Vehicle } from '@/entities/parking/model/parking.types';
import { User } from '@/entities/user/model/user.types';
import { ErrorNotice } from '@/shared/components/Feedback';

export function AssignmentForm({ vehicles, users, admin, save }: {
  vehicles: Vehicle[]; users: User[]; admin: boolean; save: (body: unknown) => Promise<void>;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setError('');
    try { await save({ vehicleId: data.vehicleId, ...(admin ? { userId: data.userId } : {}) }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo crear la asignación.'); }
    finally { setBusy(false); }
  };
  return (
    <form className="grid gap-4" onSubmit={submit}>
      <label className="grid gap-2 text-sm font-medium">Vehículo<select className="field" name="vehicleId" required>{vehicles.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.placa} · {vehicle.marca} {vehicle.modelo}</option>)}</select></label>
      {admin && <label className="grid gap-2 text-sm font-medium">Propietario<select className="field" name="userId" required>{users.filter(user => user.active).map(user => <option key={user.idPerson} value={user.idPerson}>{user.persona.firstName} {user.persona.lastName} · {user.username}</option>)}</select></label>}
      {error && <ErrorNotice message={error} />}
      <button className="primary-button" disabled={busy || !vehicles.length}>{busy && <LoaderCircle className="animate-spin" size={18} />}Crear asignación</button>
    </form>
  );
}
