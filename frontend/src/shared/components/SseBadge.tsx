'use client';

import { Radio } from 'lucide-react';
import { useSse } from '@/shared/hooks/useSse';

export function SseBadge({ onEvent }: { onEvent?: () => void }) {
  const { connected } = useSse('/sse/espacios', onEvent);

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur-md" style={{ borderColor: 'var(--border)', background: 'var(--surface-soft)' }}>
      <span className={`size-2 rounded-full ${connected ? 'animate-pulse bg-emerald-500' : 'bg-amber-500'}`} />
      <Radio size={13} className={connected ? 'text-emerald-500' : 'text-amber-500'} />
      <span>{connected ? 'SSE En vivo' : 'Conectando SSE...'}</span>
    </div>
  );
}
