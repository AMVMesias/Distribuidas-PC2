'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/model/AuthContext';
import { Ticket, Vehicle, Zone } from '@/entities/parking/model/parking.types';
import { User } from '@/entities/user/model/user.types';

export interface DashboardData {
  zones: Zone[]; vehicles: Vehicle[]; tickets: Ticket[]; users: User[];
}

const empty: DashboardData = { zones: [], vehicles: [], tickets: [], users: [] };

export function useDashboardData() {
  const { request, hasRole } = useAuth();
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true); setError('');
      const calls: Promise<unknown>[] = [
        request<Zone[]>('/api/v1/zonas'),
        request<Vehicle[]>('/api/v1/vehiculos'),
        request<Ticket[]>('/api/v1/tickets'),
      ];
      if (hasRole('ADMIN', 'ROOT')) calls.push(request<User[]>('/api/v1/usuarios'));
      const results = await Promise.allSettled(calls);
      if (!active) return;
      setData({
        zones: results[0].status === 'fulfilled' ? results[0].value as Zone[] : [],
        vehicles: results[1].status === 'fulfilled' ? results[1].value as Vehicle[] : [],
        tickets: results[2].status === 'fulfilled' ? results[2].value as Ticket[] : [],
        users: results[3]?.status === 'fulfilled' ? results[3].value as User[] : [],
      });
      if (results.every(result => result.status === 'rejected')) setError('No se pudo cargar el resumen. Comprueba que los microservicios estén activos.');
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [hasRole, request]);

  return { data, loading, error };
}
