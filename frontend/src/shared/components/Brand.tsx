import Image from 'next/image';
import logo from '@/shared/assets/nexo-park-logo.png';

export function Brand({ compact = false, prominent = false }: { compact?: boolean; prominent?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Image
        src={logo}
        alt=""
        priority={prominent}
        className={prominent ? 'h-14 w-12 object-contain' : 'h-11 w-10 object-contain'}
        sizes={prominent ? '48px' : '40px'}
      />
      {!compact && (
        <span className="leading-none">
          <strong className={`block tracking-tight ${prominent ? 'text-xl' : 'text-lg'}`}>Nexo Park</strong>
          <small className="text-[10px] font-medium uppercase tracking-[0.17em]" style={{ color: 'var(--muted)' }}>movilidad sin fricción</small>
        </span>
      )}
    </span>
  );
}
