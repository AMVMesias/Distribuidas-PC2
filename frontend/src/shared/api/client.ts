const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con la plataforma. Verifica que los servicios estén activos.');
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;
  if (!response.ok) {
    const message = payload?.message ?? payload?.error ?? `Error ${response.status}`;
    throw new ApiError(response.status, message, payload);
  }
  return (response.status === 204 ? undefined : payload) as T;
}
