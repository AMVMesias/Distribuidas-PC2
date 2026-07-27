'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/model/AuthContext';
import { FormField } from '@/features/auth/components/FormField';
import { AuthShell } from '@/widgets/AuthShell/AuthShell';
import { LocaleLink } from '@/shared/components/LocaleLink';
import { useI18n } from '@/shared/i18n/I18nContext';

export function RegisterView() {
  const { dictionary, locale } = useI18n();
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setSubmitting(true); setError('');
    try {
      await register({
        persona: {
          dni: String(data.dni), firstName: String(data.firstName), middleName: String(data.middleName),
          lastName: String(data.lastName), email: String(data.email), phone: String(data.phone),
          address: String(data.address), nationality: String(data.nationality),
        },
        password: String(data.password),
      });
      router.replace(`/${locale}/portal`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No fue posible crear la cuenta.');
    } finally { setSubmitting(false); }
  };

  return (
    <AuthShell>
      <section className="w-full py-4">
        <p className="eyebrow">Registro de cliente</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">{dictionary.auth.registerTitle}</h1>
        <p className="mt-3" style={{ color: 'var(--muted)' }}>{dictionary.auth.registerCopy}</p>
        <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <FormField id="firstName" name="firstName" label="Nombres" maxLength={30} required />
          <FormField id="lastName" name="lastName" label="Apellidos" maxLength={30} required />
          <FormField id="middleName" name="middleName" label="Segundo nombre" maxLength={30} />
          <FormField id="dni" name="dni" label="Documento" maxLength={30} required />
          <FormField id="email" name="email" type="email" label="Correo electrónico" maxLength={50} required />
          <FormField id="phone" name="phone" type="tel" label="Teléfono" maxLength={15} />
          <FormField id="nationality" name="nationality" label="Nacionalidad" maxLength={30} />
          <FormField id="address" name="address" label="Dirección" maxLength={255} />
          <div className="sm:col-span-2"><FormField id="password" name="password" type="password" label={dictionary.auth.password} hint="Mínimo 8 caracteres." minLength={8} maxLength={72} required /></div>
          {error && <p role="alert" className="sm:col-span-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
          <button className="primary-button mt-2 w-full sm:col-span-2" disabled={submitting}>
            {submitting ? <LoaderCircle className="animate-spin" size={18} /> : <ArrowRight size={18} />}
            {dictionary.auth.submitRegister}
          </button>
        </form>
        <p className="mt-7 text-center text-sm" style={{ color: 'var(--muted)' }}>{dictionary.auth.hasAccount} <LocaleLink href="/login" className="font-semibold text-[var(--brand)]">{dictionary.nav.login}</LocaleLink></p>
      </section>
    </AuthShell>
  );
}
