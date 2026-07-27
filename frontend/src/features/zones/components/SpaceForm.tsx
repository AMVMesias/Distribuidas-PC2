'use client';

import { FormEvent, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { FormField } from '@/features/auth/components/FormField';
import { ErrorNotice } from '@/shared/components/Feedback';

export function SpaceForm({ zoneId, save }: { zoneId: string; save: (body: unknown) => Promise<void> }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setError('');
    try {
      await save({
        codigo: data.codigo, idZona: zoneId, descripcion: data.descripcion,
        tipo: data.tipo, capacidad: Number(data.capacidad), estado: 'DISPONIBLE',
      });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo guardar el espacio.'); }
    finally { setBusy(false); }
  };

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
      <FormField id="codigo" name="codigo" label="Código" maxLength={16} required />
      <label className="grid gap-2 text-sm font-medium">Tipo<select name="tipo" className="field" required><option>AUTO</option><option>MOTO</option><option>BUS</option></select></label>
      <FormField id="capacidad" name="capacidad" type="number" label="Capacidad" min={1} max={300} required />
      <div className="sm:col-span-2"><FormField id="descripcion" name="descripcion" label="Descripción" maxLength={100} required /></div>
      {error && <div className="sm:col-span-2"><ErrorNotice message={error} /></div>}
      <button className="primary-button sm:col-span-2" disabled={busy}>{busy && <LoaderCircle className="animate-spin" size={18} />}Guardar espacio</button>
    </form>
  );
}
