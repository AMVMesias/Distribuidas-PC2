'use client';

import { FormEvent, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Role } from '@/entities/user/model/user.types';
import { FormField } from '@/features/auth/components/FormField';
import { ErrorNotice } from '@/shared/components/Feedback';

export function UserForm({ roles, save }: { roles: Role[]; save: (body: unknown, roleId: string) => Promise<void> }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setError('');
    try {
      await save({
        persona: {
          dni: data.dni, firstName: data.firstName, middleName: '', lastName: data.lastName,
          email: data.email, phone: data.phone, address: data.address, nationality: data.nationality,
        },
        password: data.password,
      }, String(data.roleId));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo crear el usuario.'); }
    finally { setBusy(false); }
  };
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
      <FormField id="user-firstName" name="firstName" label="Nombres" maxLength={30} required />
      <FormField id="user-lastName" name="lastName" label="Apellidos" maxLength={30} required />
      <FormField id="user-dni" name="dni" label="Documento" maxLength={30} required />
      <FormField id="user-email" name="email" type="email" label="Correo" maxLength={50} required />
      <FormField id="user-phone" name="phone" label="Teléfono" maxLength={15} />
      <FormField id="user-nationality" name="nationality" label="Nacionalidad" maxLength={30} />
      <div className="sm:col-span-2"><FormField id="user-address" name="address" label="Dirección" maxLength={255} /></div>
      <FormField id="user-password" name="password" type="password" label="Contraseña temporal" minLength={8} maxLength={72} required />
      <label className="grid gap-2 text-sm font-medium">Rol inicial<select className="field" name="roleId" required>{roles.filter(role => role.active).map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
      {error && <div className="sm:col-span-2"><ErrorNotice message={error} /></div>}
      <button className="primary-button sm:col-span-2" disabled={busy}>{busy && <LoaderCircle className="animate-spin" size={18} />}Crear usuario</button>
    </form>
  );
}
