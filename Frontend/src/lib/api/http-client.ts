/**
 * http-client.ts — Cliente HTTP centralizado y tipado para Warengine.
 *
 * Principios SOLID aplicados:
 * - Single Responsibility (SRP): Único responsable de la comunicación por red,
 *   serialización, headers y gestión de cookies de sesión.
 * - Dependency Inversion (DIP): Define la interfaz IHttpClient para que los
 *   servicios de negocio dependan de una abstracción y no de llamadas fetch directas.
 *
 * Prácticas de seguridad implementadas:
 * - credentials: 'include' por defecto: Transmite y recibe cookies HttpOnly (access_token, refresh_token).
 * - Silent Refresh Interceptor con Mutex: Si un endpoint autenticado retorna 401,
 *   intenta renovar el par de tokens mediante /auth/renovar-token antes de fallar.
 */

import { env } from '../config/env';
import { ApiError, ApiErrorPayload } from './api-error';

export interface RequestConfig extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuthRefresh?: boolean;
}

export interface IHttpClient {
  get<T>(endpoint: string, config?: RequestConfig): Promise<T>;
  post<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T>;
  put<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T>;
  patch<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T>;
  delete<T>(endpoint: string, config?: RequestConfig): Promise<T>;
}

export class HttpClient implements IHttpClient {
  private readonly baseUrl: string;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string = env.apiUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Construye la URL completa anexando query parameters si existen.
   */
  private buildUrl(endpoint: string, params?: RequestConfig['params']): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Método de ejecución base para toda petición HTTP.
   */
  private async request<T>(endpoint: string, method: string, body?: unknown, config: RequestConfig = {}): Promise<T> {
    const { params, skipAuthRefresh = false, headers: customHeaders, ...customConfig } = config;
    const url = this.buildUrl(endpoint, params);

    const headers = new Headers(customHeaders);
    if (body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const init: RequestInit = {
      method,
      headers,
      credentials: 'include', // Imprescindible para cookies HttpOnly
      ...customConfig,
    };

    if (body !== undefined) {
      init.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (networkError) {
      throw new ApiError(0, {
        error: 'NETWORK_ERROR',
        message: 'No se pudo conectar con el servidor. Revisa tu conexión de red o si la API está disponible.',
      });
    }

    // Interceptor: Silencioso refresco de sesión en 401 si no es una ruta de auth inicial
    const esRutaAuthExcluida =
      endpoint.includes('/auth/login') ||
      endpoint.includes('/auth/renovar-token') ||
      endpoint.includes('/auth/logout');

    if (response.status === 401 && !skipAuthRefresh && !esRutaAuthExcluida) {
      const renovacionExitosa = await this.ejecutarRenovacionToken();

      if (renovacionExitosa) {
        // Reintentar la petición original con skipAuthRefresh=true para prevenir bucles infinitos
        return this.request<T>(endpoint, method, body, {
          ...config,
          skipAuthRefresh: true,
        });
      }
    }

    return this.parseResponse<T>(response);
  }

  /**
   * Maneja la respuesta HTTP extrayendo el JSON o lanzando un ApiError estructurado.
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const esJson = contentType && contentType.includes('application/json');

    let data: unknown;
    try {
      data = esJson ? await response.json() : await response.text();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const payload: ApiErrorPayload =
        typeof data === 'object' && data !== null
          ? (data as ApiErrorPayload)
          : { message: typeof data === 'string' ? data : `Error HTTP ${response.status}` };

      throw new ApiError(response.status, payload);
    }

    return data as T;
  }

  /**
   * Ejecuta la renovación del refresh token utilizando un Mutex (Promise)
   * para evitar múltiples llamadas concurrentes de refresco simultáneas.
   */
  private async ejecutarRenovacionToken(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const renovarUrl = `${this.baseUrl}/auth/renovar-token`;
        const res = await fetch(renovarUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        return res.ok;
      } catch {
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  public get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, 'GET', undefined, config);
  }

  public post<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, 'POST', body, config);
  }

  public put<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, 'PUT', body, config);
  }

  public patch<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, 'PATCH', body, config);
  }

  public delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, 'DELETE', undefined, config);
  }
}

/** Instancia única por defecto (Singleton) lista para inyectar en repositorios o servicios */
export const apiClient = new HttpClient();
