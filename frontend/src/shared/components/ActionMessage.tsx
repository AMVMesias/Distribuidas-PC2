import { CheckCircle2 } from 'lucide-react';

export function ActionMessage({ message }: { message: string }) {
  if (!message) return null;
  return <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><CheckCircle2 size={18} />{message}</p>;
}
