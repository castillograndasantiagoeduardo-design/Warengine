/**
 * api-client.ts — Cliente HTTP centralizado para WarEngine Frontend.
 * Maneja cabeceras, token JWT y fallback de autenticación en desarrollo.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8017';
const TOKEN_KEY = 'warengine_access_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Garantiza una sesión activa de Super Admin para desarrollo conectando al backend.
 */
export async function ensureSuperAdminSession(): Promise<string | null> {
  let token = getStoredToken();
  if (token) return token;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@warengine.local',
        password: 'Warengine.Admin.2026!',
      }),
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.accessToken) {
        setStoredToken(data.accessToken);
        return data.accessToken;
      }
    }
  } catch (err) {
    console.warn('[api-client] No se pudo auto-autenticar con superadmin:', err);
  }

  return null;
}

export interface ApiFetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  let token = getStoredToken();

  // Si no hay token, intentamos auto-login en dev
  if (!token) {
    token = await ensureSuperAdminSession();
  }

  const { params, headers, ...rest } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  if (params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        query.append(key, String(val));
      }
    });
    const queryString = query.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const customHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (token) {
    customHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      headers: customHeaders,
      credentials: 'include',
      ...rest,
    });

    if (response.status === 401) {
      // Token expirado o revocado: reintentar login una vez
      clearStoredToken();
      const newToken = await ensureSuperAdminSession();
      if (newToken) {
        customHeaders['Authorization'] = `Bearer ${newToken}`;
        const retryRes = await fetch(url, {
          headers: customHeaders,
          credentials: 'include',
          ...rest,
        });
        if (retryRes.ok) {
          const json = await retryRes.json();
          return { data: json as T, error: null, status: retryRes.status };
        }
      }
    }

    if (!response.ok) {
      let errorMsg = `Error HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        errorMsg = errJson.message || errJson.error || errorMsg;
      } catch {
        // no json body
      }
      return { data: null, error: errorMsg, status: response.status };
    }

    // Comprobar si hay contenido
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { data: data as T, error: null, status: response.status };
    }

    return { data: null, error: null, status: response.status };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error de conexión con el backend';
    return { data: null, error: msg, status: 0 };
  }
}
