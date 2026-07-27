'use client';

import { PageHeader } from '@/shared/components/PageHeader';
import { ErrorNotice, LoadingState } from '@/shared/components/Feedback';
import { useAuth } from '@/features/auth/model/AuthContext';
import { useDashboardData } from '@/pageviews/dashboard/model/useDashboardData';
import { StatCards } from '@/pageviews/dashboard/components/StatCards';
import { DashboardPanels } from '@/pageviews/dashboard/components/DashboardPanels';

export function DashboardView() {
  const { user, hasRole } = useAuth();
  const { data, loading, error } = useDashboardData();
  const admin = hasRole('ADMIN', 'ROOT');
  const roleLabel = hasRole('RECAUDADOR') ? 'operación' : admin ? 'administración' : 'tu cuenta';

  return (
    <>
      <PageHeader
        eyebrow={`Panel de ${roleLabel}`}
        title={`Hola, ${user?.persona.firstName ?? user?.username}`}
        description="Aquí tienes lo importante para continuar, sin ruido ni información fuera de contexto."
      />
      {error && <ErrorNotice message={error} />}
      {loading ? <LoadingState /> : <><StatCards data={data} admin={admin} /><DashboardPanels data={data} /></>}
    </>
  );
}
