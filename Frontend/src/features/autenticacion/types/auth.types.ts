/**
 * auth.types.ts — Tipos y contratos para el módulo de autenticación en Frontend.
 *
 * Importa y re-exporta los contratos oficiales de @warengine/contracts como
 * única fuente de verdad (Single Source of Truth), asegurando tipado estricto
 * idéntico al backend.
 */

import type {
  LoginInput,
  LoginResponseDto,
  UsuarioSesionDto,
  Verificar2faLoginInput,
  SolicitarRecuperacionPasswordInput,
  ConfirmarRestablecerPasswordInput,
} from '@warengine/contracts';

// Re-exportar DTOs de contratos
export type {
  LoginInput,
  LoginResponseDto,
  UsuarioSesionDto,
  Verificar2faLoginInput,
  SolicitarRecuperacionPasswordInput,
  ConfirmarRestablecerPasswordInput,
};

/**
 * Representa la identidad del usuario autenticado en la sesión frontend.
 */
export interface UsuarioSesion {
  id: string;
  email: string;
  rolId: number;
  rolNombre: string;
}

/**
 * Estructura de sesión completa en memoria (perfil + permisos RBAC).
 */
export interface SesionCompleta {
  usuario: UsuarioSesion;
  permisos: string[];
}

/**
 * Resultado discriminado del intento de inicio de sesión.
 * Permite a la interfaz reaccionar al éxito inmediato o transición a 2FA.
 */
export type LoginResult =
  | {
      tipo: 'EXITO';
      data: LoginResponseDto;
    }
  | {
      tipo: 'REQUIERE_2FA';
      tempToken: string;
      message: string;
    };

/**
 * Estado del control de mitigación de fuerza bruta / rate limit (HTTP 429).
 */
export interface RateLimitState {
  bloqueado: boolean;
  mensaje?: string;
  tiempoRestanteSegundos?: number;
}
