const statusColors: Record<string, string> = {
  DISPONIBLE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  ACTIVO: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  PAGADO: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  OCUPADO: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  CANCELADO: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  INACTIVE: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  FUERA_DE_SERVICIO: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColors[status] ?? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'}`}>{status.replaceAll('_', ' ')}</span>;
}
