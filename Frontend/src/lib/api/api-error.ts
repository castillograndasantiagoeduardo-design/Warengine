/**
 * api-error.ts — Clase de error estandarizada para respuestas fallidas de la API.
 *
 * Captura todos los metadatos devueltos por el backend de Warengine:
 * - status: Código HTTP (400, 401, 403, 404, 428, 429, 500)
 * - code: Código semántico de dominio (ej. 'CREDENCIALES_INVALIDAS', 'REQUIERE_2FA', 'LOGIN_BLOQUEADO')
 * - tempToken: Token temporal entregado en 428 para el segundo factor (2FA TOTP)
 * - issues: Arreglo de validaciones fallidas de Zod (si aplica)
 */

export interface ApiValidationIssue {
  path: (string | number)[];
  message: string;
}

export interface ApiErrorPayload {
  error?: string;
  message?: string;
  tempToken?: string;
  issues?: ApiValidationIssue[];
  [key: string]: unknown;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly tempToken?: string;
  public readonly issues?: ApiValidationIssue[];
  public readonly rawPayload?: ApiErrorPayload;

  constructor(status: number, payload?: ApiErrorPayload) {
    const message = payload?.message || payload?.error || `Error HTTP ${status}`;
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = payload?.error || `HTTP_${status}`;
    this.tempToken = typeof payload?.tempToken === 'string' ? payload.tempToken : undefined;
    this.issues = Array.isArray(payload?.issues) ? payload.issues : undefined;
    this.rawPayload = payload;

    // Mantiene el stack trace adecuado en V8/Node/Navegadores
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Indica si el error se debe a credenciales inválidas (401 CREDENCIALES_INVALIDAS).
   */
  public isCredencialesInvalidas(): boolean {
    return this.status === 401 && this.code === 'CREDENCIALES_INVALIDAS';
  }

  /**
   * Indica si la cuenta se encuentra inactiva (401 USUARIO_INACTIVO).
   */
  public isUsuarioInactivo(): boolean {
    return this.status === 401 && this.code === 'USUARIO_INACTIVO';
  }

  /**
   * Indica si la solicitud requiere verificación de segundo factor (428 REQUIERE_2FA).
   */
  public isRequiere2FA(): boolean {
    return this.status === 428 || this.code === 'REQUIERE_2FA';
  }

  /**
   * Indica si la petición fue bloqueada por mitigación de fuerza bruta (429 LOGIN_BLOQUEADO).
   */
  public isLoginBloqueado(): boolean {
    return this.status === 429 || this.code === 'LOGIN_BLOQUEADO' || this.code === 'LIMITE_SOLICITUDES_EXCEDIDO';
  }

  /**
   * Indica si el error es de sesión/token inválido o expirado.
   */
  public isTokenInvalido(): boolean {
    return this.status === 401 && (this.code === 'TOKEN_INVALIDO' || this.code === 'HTTP_401');
  }

  /**
   * Indica si el error es de permisos insuficientes (403).
   */
  public isPermisoDenegado(): boolean {
    return this.status === 403 || this.code === 'PERMISO_DENEGADO';
  }
}
