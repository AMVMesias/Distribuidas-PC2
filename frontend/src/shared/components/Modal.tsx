'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean; close: () => void; title: string;
  description?: string; children: React.ReactNode;
}

export function Modal({ open, close, title, description, children }: ModalProps) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    if (open) {
      addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [close, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid items-end bg-black/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button className="absolute inset-0" onClick={close} aria-label="Cerrar" />
      <section className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-[1.75rem] border p-5 shadow-2xl sm:max-w-2xl sm:rounded-[1.75rem] sm:p-7" style={{ background: 'var(--surface)' }}>
        <header className="flex items-start justify-between gap-5">
          <div><h2 id="modal-title" className="text-2xl font-semibold tracking-[-0.03em]">{title}</h2>{description && <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>{description}</p>}</div>
          <button onClick={close} className="grid size-10 shrink-0 place-items-center rounded-full border" aria-label="Cerrar"><X size={18} /></button>
        </header>
        <div className="mt-7">{children}</div>
      </section>
    </div>
  );
}
