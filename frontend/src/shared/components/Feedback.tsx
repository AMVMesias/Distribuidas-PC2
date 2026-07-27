import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react';

export function LoadingState({ label = 'Cargando información...' }: { label?: string }) {
  return <div className="grid min-h-52 place-items-center text-sm" style={{ color: 'var(--muted)' }}><span className="flex items-center gap-3"><LoaderCircle className="animate-spin" />{label}</span></div>;
}

export function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="grid min-h-52 place-items-center px-5 text-center">
      <div><Inbox className="mx-auto text-[var(--brand)]" /><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>{copy}</p></div>
    </div>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return <p role="alert" className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"><AlertCircle className="shrink-0" size={19} />{message}</p>;
}
