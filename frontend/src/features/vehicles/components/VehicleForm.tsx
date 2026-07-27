'use client';

import { FormEvent, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { FormField } from '@/features/auth/components/FormField';
import { ErrorNotice } from '@/shared/components/Feedback';
import { VehicleType } from '@/entities/parking/model/parking.types';

export function VehicleForm({ save }: { save: (body: unknown) => Promise<void> }) {
  const [type, setType] = useState<VehicleType>('auto');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const specific = type === 'auto'
      ? { numeroPuertas: Number(data.numeroPuertas), capacidadMaletero: Number(data.capacidadMaletero) }
      : type === 'motocicleta' ? { tipoMoto: data.tipoMoto }
        : { capacidadCarga: Number(data.capacidadCarga), traccion: data.traccion };
    setBusy(true); setError('');
    try {
      await save({
        tipo: type,
        datos: {
          placa: String(data.placa).toUpperCase(), marca: data.marca, modelo: data.modelo,
          color: data.color, anio: Number(data.anio), clasificacion: data.clasificacion, ...specific,
        },
      });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo guardar el vehículo.'); }
    finally { setBusy(false); }
  };

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
      <label className="grid gap-2 text-sm font-medium">Tipo<select className="field" value={type} onChange={event => setType(event.target.value as VehicleType)}><option value="auto">Auto</option><option value="motocicleta">Motocicleta</option><option value="camioneta">Camioneta</option></select></label>
      <FormField id="placa" name="placa" label="Placa" placeholder="ABC-1234" pattern="[A-Za-z]{3}-[0-9]{4}" required />
      <FormField id="marca" name="marca" label="Marca" minLength={2} maxLength={30} required />
      <FormField id="modelo" name="modelo" label="Modelo" minLength={2} maxLength={150} required />
      <FormField id="color" name="color" label="Color" minLength={2} maxLength={30} required />
      <FormField id="anio" name="anio" type="number" label="Año" min={1886} max={new Date().getFullYear() + 1} required />
      <label className="grid gap-2 text-sm font-medium">Clasificación<select className="field" name="clasificacion"><option>Gasolina</option><option>Hibrido</option><option>Electrico</option></select></label>
      {type === 'auto' && <><FormField id="numeroPuertas" name="numeroPuertas" type="number" label="Número de puertas" min={2} max={4} required /><FormField id="capacidadMaletero" name="capacidadMaletero" type="number" label="Maletero (litros)" min={0} max={2000} required /></>}
      {type === 'motocicleta' && <label className="grid gap-2 text-sm font-medium">Tipo de moto<select className="field" name="tipoMoto"><option>Deportiva</option><option>Scooter</option><option>Motocross</option></select></label>}
      {type === 'camioneta' && <><FormField id="capacidadCarga" name="capacidadCarga" type="number" label="Carga (kg)" min={0} max={20000} required /><label className="grid gap-2 text-sm font-medium">Tracción<select className="field" name="traccion"><option>4x2</option><option>4x4</option><option>AWD</option></select></label></>}
      {error && <div className="sm:col-span-2"><ErrorNotice message={error} /></div>}
      <button className="primary-button sm:col-span-2" disabled={busy}>{busy && <LoaderCircle className="animate-spin" size={18} />}Registrar vehículo</button>
    </form>
  );
}
