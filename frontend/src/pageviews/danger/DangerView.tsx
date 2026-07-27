'use client';

import { FormEvent, useState } from 'react';
import { ShieldAlert, Trash2 } from 'lucide-react';
import { useAuth } from '@/features/auth/model/AuthContext';
import { PageHeader } from '@/shared/components/PageHeader';
import { ErrorNotice } from '@/shared/components/Feedback';
import { ActionMessage } from '@/shared/components/ActionMessage';
import { FormField } from '@/features/auth/components/FormField';

const endpoints: Record<string, string> = {
  usuarios: 'usuarios', personas: 'personas', roles: 'roles',
  zonas: 'zonas', espacios: 'espacios', vehiculos: 'vehiculos',
};

export function DangerView() {
  const { request, hasRole } = useAuth();
  const [type, setType] = useState('usuarios');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const allowed = hasRole('ROOT');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get('confirmation') !== 'ELIMINAR') { setError('Escribe ELIMINAR para confirmar.'); return; }
    const first = String(data.get('resourceId'));
    const second = String(data.get('vehicleId'));
    const path = type === 'asignaciones'
      ? `/api/v1/root/asignaciones/${first}/${second}`
      : `/api/v1/root/${endpoints[type]}/${first}`;
    setError(''); setMessage('');
    try {
      await request(path, { method: 'DELETE' });
      setMessage('El recurso fue eliminado físicamente. Esta acción no se puede deshacer.');
      form.reset();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo eliminar el recurso.'); }
  };

  if (!allowed) return <ErrorNotice message="Esta sección requiere el rol ROOT." />;
  return (
    <>
      <PageHeader eyebrow="Acceso ROOT" title="Zona crítica" description="Elimina físicamente recursos previamente verificados. Estas operaciones son irreversibles." />
      <section className="max-w-2xl rounded-[1.75rem] border border-red-300 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30 sm:p-8">
        <div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300"><ShieldAlert /></span><div><h2 className="text-xl font-semibold text-red-700 dark:text-red-300">Eliminación permanente</h2><p className="mt-2 text-sm leading-6 text-red-700/80 dark:text-red-300/80">Confirma el recurso exacto antes de continuar. No uses esta sección para una desactivación normal.</p></div></div>
        <form className="mt-8 grid gap-5" onSubmit={submit}>
          <label className="grid gap-2 text-sm font-medium">Tipo de recurso<select className="field" value={type} onChange={event => setType(event.target.value)}><option value="usuarios">Usuario</option><option value="personas">Persona</option><option value="roles">Rol</option><option value="zonas">Zona</option><option value="espacios">Espacio</option><option value="vehiculos">Vehículo</option><option value="asignaciones">Asignación</option></select></label>
          <FormField id="danger-resource" name="resourceId" label={type === 'asignaciones' ? 'ID del usuario' : 'UUID del recurso'} required />
          {type === 'asignaciones' && <FormField id="danger-vehicle" name="vehicleId" label="ID del vehículo" required />}
          <FormField id="danger-confirmation" name="confirmation" label='Escribe "ELIMINAR"' autoComplete="off" required />
          {error && <ErrorNotice message={error} />}{message && <ActionMessage message={message} />}
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-red-600 px-6 text-sm font-semibold text-white"><Trash2 size={17} />Eliminar físicamente</button>
        </form>
      </section>
    </>
  );
}
