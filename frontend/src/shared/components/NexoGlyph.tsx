import type { ReactNode } from 'react';

export type NexoGlyphKind =
  'shield' | 'speed' | 'data' | 'devices' |
  'profile' | 'vehicle' | 'scan' | 'ticket';

const drawings: Record<NexoGlyphKind, ReactNode> = {
  shield: <><path d="M16 4 25 8v7c0 6-3.8 10.2-9 13-5.2-2.8-9-7-9-13V8l9-4Z" /><path d="m12 16 2.5 2.5L20 13" /></>,
  speed: <><path d="M5 21a12 12 0 0 1 22 0" /><path d="m16 19 6-7M9 22h14" /><circle cx="16" cy="19" r="2" /></>,
  data: <><path d="m5 10 11-5 11 5-11 5L5 10Z" /><path d="m5 16 11 5 11-5M5 22l11 5 11-5" /><circle cx="16" cy="15" r="1.5" /></>,
  devices: <><rect x="4" y="7" width="17" height="13" rx="2" /><path d="M9 25h7M12.5 20v5" /><rect x="20" y="14" width="8" height="13" rx="2" /></>,
  profile: <><circle cx="16" cy="11" r="5" /><path d="M7 27c1-6 4-9 9-9s8 3 9 9" /><path d="M4 16a12 12 0 1 0 24 0" /></>,
  vehicle: <><path d="m6 20 2-8h16l2 8v6H6v-6ZM10 12l2-5h8l2 5" /><path d="M6 20h20M10 25v3M22 25v3" /><circle cx="11" cy="20" r="1.5" /><circle cx="21" cy="20" r="1.5" /></>,
  scan: <><path d="M5 11V6h5M22 6h5v5M27 21v5h-5M10 26H5v-5" /><path d="M9 16h14M12 12h8M12 20h8" /></>,
  ticket: <><path d="M5 9h22v5a3 3 0 0 0 0 6v5H5v-5a3 3 0 0 0 0-6V9Z" /><path d="M16 12v2M16 18v2M16 23v-1" /></>,
};

export function NexoGlyph({ kind, size = 24, className }: { kind: NexoGlyphKind; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {drawings[kind]}
    </svg>
  );
}
