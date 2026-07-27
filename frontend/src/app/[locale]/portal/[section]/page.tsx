import { notFound } from 'next/navigation';
import { AssignmentsView } from '@/pageviews/assignments/AssignmentsView';
import { DangerView } from '@/pageviews/danger/DangerView';
import { OperationView } from '@/pageviews/operation/OperationView';
import { ProfileView } from '@/pageviews/profile/ProfileView';
import { RolesView } from '@/pageviews/roles/RolesView';
import { TicketsView } from '@/pageviews/tickets/TicketsView';
import { UsersView } from '@/pageviews/users/UsersView';
import { VehiclesView } from '@/pageviews/vehicles/VehiclesView';
import { ZonesView } from '@/pageviews/zones/ZonesView';

const views: Record<string, React.ComponentType> = {
  zonas: ZonesView,
  vehiculos: VehiclesView,
  tickets: TicketsView,
  operacion: OperationView,
  usuarios: UsersView,
  asignaciones: AssignmentsView,
  roles: RolesView,
  perfil: ProfileView,
  peligro: DangerView,
};

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const View = views[section];
  if (!View) notFound();
  return <View />;
}
