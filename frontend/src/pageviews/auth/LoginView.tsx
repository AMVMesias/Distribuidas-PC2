'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/model/AuthContext';
import { FormField } from '@/features/auth/components/FormField';
import { AuthShell } from '@/widgets/AuthShell/AuthShell';
import { LocaleLink } from '@/shared/components/LocaleLink';
import { useI18n } from '@/shared/i18n/I18nContext';

export function LoginView() {
  const { dictionary, locale } = useI18n();
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true); setError('');
    try {
      await login(String(form.get('username')), String(form.get('password')));
      router.replace(`/${locale}/portal`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No fue posible iniciar sesión.');
    } finally { setSubmitting(false); }
  };

  return (
    <AuthShell>
      <section className="w-full">
        <p className="eyebrow">Acceso seguro</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">{dictionary.auth.loginTitle}</h1>
        <p className="mt-3" style={{ color: 'var(--muted)' }}>{dictionary.auth.loginCopy}</p>
        <form className="mt-9 grid gap-5" onSubmit={submit}>
          <FormField id="username" name="username" label={dictionary.auth.username} autoComplete="username" required />
          <FormField id="password" name="password" type="password" label={dictionary.auth.password} autoComplete="current-password" minLength={8} required />
          {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
          <button className="primary-button mt-2 w-full" disabled={submitting}>
            {submitting ? <LoaderCircle className="animate-spin" size={18} /> : <ArrowRight size={18} />}
            {dictionary.auth.submitLogin}
          </button>
        </form>
        <p className="mt-7 text-center text-sm" style={{ color: 'var(--muted)' }}>
          {dictionary.auth.noAccount}{' '}
          <LocaleLink href="/registro" className="font-semibold text-[var(--brand)]">{dictionary.nav.register}</LocaleLink>
        </p>
      </section>
    </AuthShell>
  );
}
