'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/model/AuthContext';

export function useResource<T>(path: string, initial: T, enabled = true) {
  const { request } = useAuth();
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!enabled) { setLoading(false); return; }
    setLoading(true); setError('');
    try { setData(await request<T>(path)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo cargar la información.'); }
    finally { setLoading(false); }
  }, [enabled, path, request]);

  useEffect(() => {
    const timer = setTimeout(() => { void reload(); }, 0);
    return () => clearTimeout(timer);
  }, [reload]);
  return { data, setData, loading, error, reload };
}
