'use client';

import { useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Ticket, Zone } from '@/entities/parking/model/parking.types';
import { useAuth } from '@/features/auth/model/AuthContext';
import { useResource } from '@/shared/model/useResource';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState, ErrorNotice, LoadingState } from '@/shared/components/Feedback';
import { Modal } from '@/shared/components/Modal';
import { ZoneForm } from '@/features/zones/components/ZoneForm';
import { SpaceForm } from '@/features/zones/components/SpaceForm';
import { ZoneCard } from '@/pageviews/zones/components/ZoneCard';
import { SseBadge } from '@/shared/components/SseBadge';

export function ZonesView() {
  const { request, hasRole } = useAuth();
  const { data, loading, error, reload } = useResource<Zone[]>('/api/v1/zonas', []);
  const activeTickets = useResource<Ticket[]>('/api/v1/tickets?estado=ACTIVO', []);
  const canEdit = hasRole('ADMIN', 'ROOT');
  const [zoneModal, setZoneModal] = useState(false);
  const [spaceZone, setSpaceZone] = useState<Zone | null>(null);

  const ticketMap = useMemo(() => {
    if (!canEdit || !Array.isArray(activeTickets.data)) return undefined;
    const map = new Map<string, Ticket>();
    activeTickets.data.forEach(ticket => {
      if (ticket.idEspacio) map.set(ticket.idEspacio, ticket);
    });
    return map;
  }, [canEdit, activeTickets.data]);

  const reloadAll = () => {
    reload();
    if (canEdit) activeTickets.reload();
  };

  const create = async (path: string, body: unknown, close: () => void) => {
    await request(path, { method: 'POST', body: JSON.stringify(body) });
    close(); await reloadAll();
  };
  const changeStatus = async (spaceId: string, status: string) => {
    await request(`/api/v1/espacios/${spaceId}/estado/${status}`, { method: 'PUT' });
    await reloadAll();
  };

  return (
    <>
      <PageHeader
        eyebrow="Infraestructura"
        title="Zonas y espacios"
        description="Consulta la distribución del parqueadero. Las acciones de configuración aparecen únicamente para administración."
        actions={
          <>
            <SseBadge onEvent={reloadAll} />
            <button onClick={reloadAll} className="secondary-button min-h-10 px-4"><RefreshCw size={16} />Actualizar</button>
            {canEdit && <button onClick={() => setZoneModal(true)} className="primary-button min-h-10 px-4"><Plus size={16} />Nueva zona</button>}
          </>
        }
      />
      {error && <ErrorNotice message={error} />}
      {loading ? <LoadingState /> : <div className="grid gap-5">{data.map(zone => <ZoneCard key={zone.id} zone={zone} canEdit={canEdit} addSpace={() => setSpaceZone(zone)} changeStatus={changeStatus} ticketMap={ticketMap} />)}{!data.length && <EmptyState title="No hay zonas registradas" copy="Cuando se cree una zona aparecerá en este espacio." />}</div>}
      <Modal open={zoneModal} close={() => setZoneModal(false)} title="Crear nueva zona"><ZoneForm save={body => create('/api/v1/zonas', body, () => setZoneModal(false))} /></Modal>
      <Modal open={Boolean(spaceZone)} close={() => setSpaceZone(null)} title={`Añadir espacio a ${spaceZone?.nombre ?? ''}`}>
        {spaceZone && <SpaceForm zoneId={spaceZone.id} save={body => create('/api/v1/espacios', body, () => setSpaceZone(null))} />}
      </Modal>
    </>
  );
}
