'use client';

import { FormEvent, useState } from 'react';
import { FormField } from '@/features/auth/components/FormField';
import { ErrorNotice } from '@/shared/components/Feedback';
import { ActionMessage } from '@/shared/components/ActionMessage';

export function PasswordForm({ save }: { save: (password: string) => Promise<void> }) {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get('password'));
    if (password !== data.get('confirmation')) { setError('Las contraseñas no coinciden.'); return; }
    setError(''); setMessage('');
    try { await save(password); form.reset(); setMessage('Contraseña actualizada.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo cambiar la contraseña.'); }
  };
  return (
    <form className="grid gap-4" onSubmit={submit}>
      <FormField id="new-password" name="password" type="password" label="Nueva contraseña" minLength={8} required />
      <FormField id="confirm-password" name="confirmation" type="password" label="Confirmar contraseña" minLength={8} required />
      {error && <ErrorNotice message={error} />}{message && <ActionMessage message={message} />}
      <button className="secondary-button">Actualizar contraseña</button>
    </form>
  );
}
