/**
 * Future REST API provider stub.
 *
 * When a custom backend is available, implement these functions
 * to point at your API endpoints (e.g. /api/users, /api/services).
 *
 * This file is NOT used until VITE_DATA_PROVIDER=backend.
 */

const API_BASE = import.meta.env.VITE_BACKEND_API_URL || '/api';

const headers = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/** Generic fetch helper */
const request = async <T>(
  method: string,
  path: string,
  body?: unknown
): Promise<{ data: T | null; error: Error | null }> => {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: headers(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ message: res.statusText }));
      return { data: null, error: new Error(errBody.message || res.statusText) };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
};

export const backendApi = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

/**
 * Example usage (future):
 *
 * import { backendApi } from '@/services/providers/backendApiProvider';
 *
 * const { data, error } = await backendApi.get<User[]>('/users');
 * const { data, error } = await backendApi.post('/users', { name: 'Alice' });
 */
