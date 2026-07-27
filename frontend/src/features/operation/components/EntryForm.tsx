'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { Space } from '@/entities/parking/model/parking.types';
import { FormField } from '@/features/auth/components/FormField';
import { ErrorNotice } from '@/shared/components/Feedback';

export function EntryForm({ spaces, submit }: { spaces: Space[]; submit: (body: unknown) => Promise<void> }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setError('');
    try {
      await submit({ placa: String(data.placa).toUpperCase(), idEspacio: data.idEspacio });
      event.currentTarget.reset();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No fue posible registrar la entrada.'); }
    finally { setBusy(false); }
  };

  return (
    <form className="grid gap-5" onSubmit={save}>
      <FormField id="entry-plate" name="placa" label="Placa del vehículo" placeholder="ABC-1234" pattern="[A-Za-z]{3}-[0-9]{4}" required />
      <label className="grid gap-2 text-sm font-medium">Espacio disponible<select name="idEspacio" className="field" required defaultValue=""><option value="" disabled>Selecciona un espacio</option>{spaces.map(space => <option value={space.id} key={space.id}>{space.codigo} · {space.nombreZona} · {space.tipo}</option>)}</select></label>
      {error && <ErrorNotice message={error} />}
      <button className="primary-button" disabled={busy || !spaces.length}>{busy ? <LoaderCircle className="animate-spin" size={18} /> : <ArrowRight size={18} />}Emitir ticket de ingreso</button>
    </form>
  );
}
