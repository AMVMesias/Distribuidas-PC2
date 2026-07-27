'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface SseState<T = unknown> {
  connected: boolean;
  data: T | null;
  error: boolean;
}

export function useSse<T = unknown>(endpoint: string, onMessage?: (data: T) => void): SseState<T> {
  const [state, setState] = useState<SseState<T>>({ connected: false, data: null, error: false });

  useEffect(() => {
    const url = `${API_URL}${endpoint}`;
    const source = new EventSource(url);

    source.onopen = () => setState(prev => ({ ...prev, connected: true, error: false }));

    source.onmessage = (event) => {
      if (!event.data) return;
      try {
        const parsed = JSON.parse(event.data) as T;
        setState({ connected: true, data: parsed, error: false });
        if (onMessage) onMessage(parsed);
      } catch {
        // Ignorar mensajes vacíos o heartbeats no conversibles a JSON
      }
    };

    source.onerror = () => setState(prev => ({ ...prev, connected: false, error: true }));

    return () => source.close();
  }, [endpoint, onMessage]);

  return state;
}
