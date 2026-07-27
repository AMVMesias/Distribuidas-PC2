'use client';

import { FormEvent, useState } from 'react';
import { User } from '@/entities/user/model/user.types';
import { FormField } from '@/features/auth/components/FormField';
import { ErrorNotice } from '@/shared/components/Feedback';
import { ActionMessage } from '@/shared/components/ActionMessage';

export function ProfileForm({ user, save }: { user: User; save: (body: unknown) => Promise<void> }) {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setError(''); setMessage('');
    try {
      await save({
        dni: data.dni, firstName: data.firstName, middleName: data.middleName,
        lastName: data.lastName, email: data.email, phone: data.phone,
        address: data.address, nationality: data.nationality,
      });
      setMessage('Tus datos se actualizaron correctamente.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el perfil.'); }
  };
  const person = user.persona;
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
      <FormField id="profile-firstName" name="firstName" label="Nombres" defaultValue={person.firstName} required />
      <FormField id="profile-lastName" name="lastName" label="Apellidos" defaultValue={person.lastName} required />
      <FormField id="profile-middleName" name="middleName" label="Segundo nombre" defaultValue={person.middleName} />
      <FormField id="profile-dni" name="dni" label="Documento" defaultValue={person.dni} required />
      <FormField id="profile-email" name="email" type="email" label="Correo" defaultValue={person.email} required />
      <FormField id="profile-phone" name="phone" label="Teléfono" defaultValue={person.phone} />
      <FormField id="profile-nationality" name="nationality" label="Nacionalidad" defaultValue={person.nationality} />
      <FormField id="profile-address" name="address" label="Dirección" defaultValue={person.address} />
      {error && <div className="sm:col-span-2"><ErrorNotice message={error} /></div>}
      {message && <div className="sm:col-span-2"><ActionMessage message={message} /></div>}
      <button className="primary-button sm:col-span-2">Guardar cambios</button>
    </form>
  );
}
