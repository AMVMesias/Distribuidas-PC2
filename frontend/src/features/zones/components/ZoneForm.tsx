'use client';

import { FormEvent, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { FormField } from '@/features/auth/components/FormField';
import { ErrorNotice } from '@/shared/components/Feedback';

export function ZoneForm({ save }: { save: (body: unknown) => Promise<void> }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setError('');
    try {
      await save({ nombre: data.nombre, descripcion: data.descripcion, tipo: data.tipo, capacidad: Number(data.capacidad) });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo guardar la zona.'); }
    finally { setBusy(false); }
  };

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
      <FormField id="nombre" name="nombre" label="Nombre" maxLength={32} required />
      <label className="grid gap-2 text-sm font-medium">Tipo<select name="tipo" className="field" required><option>REGULAR</option><option>VIP</option><option>INTERNA</option><option>EXTERNA</option><option>PREFERENCIAL</option></select></label>
      <FormField id="capacidad" name="capacidad" type="number" label="Capacidad" min={1} required />
      <div className="sm:col-span-2"><FormField id="descripcion" name="descripcion" label="Descripción" /></div>
      {error && <div className="sm:col-span-2"><ErrorNotice message={error} /></div>}
      <button className="primary-button sm:col-span-2" disabled={busy}>{busy && <LoaderCircle className="animate-spin" size={18} />}Guardar zona</button>
    </form>
  );
}
