import Image, { StaticImageData } from 'next/image';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { Dictionary } from '@/shared/i18n/types';
import alameda from '@/shared/assets/place-alameda.png';
import central from '@/shared/assets/place-central.png';
import ribera from '@/shared/assets/place-ribera.png';

const places: { name: string; kind: string; copy: string; image: StaticImageData }[] = [
  { name: 'Nexo Alameda', kind: 'Distrito verde', copy: 'Una llegada tranquila entre naturaleza y arquitectura.', image: alameda },
  { name: 'Nexo Central', kind: 'Centro empresarial', copy: 'Acceso directo para el ritmo de la ciudad.', image: central },
  { name: 'Nexo Ribera', kind: 'Corredor cultural', copy: 'Movilidad conectada con un entorno abierto.', image: ribera },
];

function PlaceCard({ place }: { place: typeof places[number] }) {
  return (
    <article className="group relative h-[30rem] w-[82vw] max-w-[46rem] flex-none overflow-hidden rounded-[2rem] sm:h-[34rem] sm:w-[62vw] lg:w-[44vw]">
      <Image src={place.image} alt={`Parqueadero ficticio ${place.name}`} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(min-width: 1024px) 44vw, 82vw" />
      <div className="absolute inset-x-4 bottom-4 rounded-[1.5rem] bg-[var(--surface)] p-5 sm:inset-x-6 sm:bottom-6 sm:p-6">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]"><MapPin size={15} />{place.kind}</span>
          <ArrowUpRight size={20} />
        </div>
        <h3 className="mt-4 text-2xl font-semibold sm:text-3xl">{place.name}</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">{place.copy}</p>
      </div>
    </article>
  );
}

export function RolesSection({ copy }: { copy: Dictionary }) {
  return (
    <section id="roles" className="overflow-hidden py-24 sm:py-32">
      <header data-reveal className="page-shell grid gap-6 lg:grid-cols-[1fr_0.7fr] lg:items-end">
        <div><p className="eyebrow">{copy.roles.eyebrow}</p><h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">{copy.roles.title}</h2></div>
        <p className="max-w-xl leading-7 text-[var(--muted)] lg:justify-self-end">{copy.roles.copy}</p>
      </header>
      <div className="mt-12 flex overflow-hidden">
        <div data-places-track className="flex min-w-max">
          {[0, 1].map(group => <div key={group} className="flex gap-5 pr-5">{places.map(place => <PlaceCard key={`${group}-${place.name}`} place={place} />)}</div>)}
        </div>
      </div>
    </section>
  );
}
