import Image from 'next/image';
import { Dictionary } from '@/shared/i18n/types';
import { NexoGlyph, type NexoGlyphKind } from '@/shared/components/NexoGlyph';
import journeyImage from '@/shared/assets/parking-journey-3d.png';

const icons: NexoGlyphKind[] = ['profile', 'vehicle', 'scan', 'ticket'];

export function HowSection({ copy }: { copy: Dictionary }) {
  return (
    <section id="como-funciona" className="page-shell py-24 sm:py-32">
      <header data-reveal className="grid gap-6 lg:grid-cols-[1fr_0.75fr] lg:items-end">
        <div>
          <p className="eyebrow">{copy.how.eyebrow}</p>
          <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">{copy.how.title}</h2>
        </div>
        <p className="max-w-xl leading-7 lg:justify-self-end" style={{ color: 'var(--muted)' }}>{copy.how.copy}</p>
      </header>
      <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-[6vw]">
          <figure data-visual-card className="relative h-[clamp(24rem,34vw,34rem)] overflow-hidden rounded-[2rem] border bg-[#f4e9d9]">
            <Image src={journeyImage} alt="Vehículo, barrera y aplicación representando el recorrido de ingreso" fill className="object-cover" sizes="(min-width: 1024px) 52vw, 100vw" />
            <figcaption className="absolute bottom-4 left-4 rounded-full bg-[var(--surface)] px-4 py-2 text-xs font-semibold">Un flujo. Cero vueltas.</figcaption>
          </figure>
        <ol className="border-t">
        {copy.how.steps.map((step, index) => {
          return (
            <li key={step} data-reveal className="grid grid-cols-[4rem_1fr_auto] gap-4 border-b py-7 sm:grid-cols-[5rem_1fr_auto]">
              <span className="grid size-12 place-items-center rounded-2xl bg-[var(--surface-soft)] text-[var(--brand)]"><NexoGlyph kind={icons[index]} /></span>
              <div>
                <h3 className="text-xl font-semibold">{step}</h3>
                <p className="mt-2 max-w-md text-sm leading-6" style={{ color: 'var(--muted)' }}>
                {index === 0 && 'Completa tus datos y accede de forma segura.'}
                {index === 1 && 'Agrega la información necesaria según su tipo.'}
                {index === 2 && 'El equipo operativo valida tu ingreso.'}
                {index === 3 && 'Revisa estado, tiempo y valor desde tu cuenta.'}
                </p>
              </div>
              <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>0{index + 1}</span>
            </li>
          );
        })}
        </ol>
      </div>
    </section>
  );
}
