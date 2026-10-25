/**
 * auth.service.ts — Implementación del servicio de autenticación para Warengine.
 *
 * Principios SOLID aplicados:
 * - Single Responsibility Principle (SRP): Centraliza todas las llamadas a la API de autenticación.
 * - Open/Closed Principle (OCP): Abierto a extensión (ej. agregar proveedores SSO en el futuro)
 *   sin modificar la interfaz de consumo de los componentes.
 * - Dependency Inversion Principle (DIP): Inyecta IHttpClient por constructor, permitiendo
 *   sustituir la capa de transporte para pruebas unitarias.
 */

import { IHttpClient, apiClient, ApiError } from '@/lib/api';
import type { IAuthService } from './auth.service.interface';
import type {
  LoginInput,
  LoginResult,
  LoginResponseDto,
  Verificar2faLoginInput,
  SesionCompleta,
  SolicitarRecuperacionPasswordInput,
  ConfirmarRestablecerPasswordInput,
} from '../types/auth.types';

const ROL_NOMBRES: Record<number, string> = {
  1: 'super-admin',
  2: 'admin-sucursal',
  3: 'cajero',
  4: 'vendedor-b2b',
};

export class AuthService implements IAuthService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  /**
   * Intenta autenticar con credenciales (email y password).
   * Maneja el caso de respuesta 428 (REQUIERE_2FA) capturando el tempToken para
   * devolver un resultado discriminado que guíe la interfaz de usuario.
   */
  public async login(credentials: LoginInput): Promise<LoginResult> {
    try {
      const response = await this.http.post<LoginResponseDto>(
        '/auth/login',
        credentials,
        { skipAuthRefresh: true },
      );

      return {
        tipo: 'EXITO',
        data: response,
      };
    } catch (error) {
      if (error instanceof ApiError && error.isRequiere2FA()) {
        return {
          tipo: 'REQUIERE_2FA',
          tempToken: error.tempToken || '',
          message: error.message || 'Se requiere código de verificación de dos factores (2FA).',
        };
      }

      // Re-lanzar ApiError (ej. CREDENCIALES_INVALIDAS, LOGIN_BLOQUEADO, etc.)
      throw error;
    }
  }

  /**
   * Valida el código TOTP de 6 dígitos junto con el tempToken generado en el paso 1.
   */
  public async verificar2FA(params: Verificar2faLoginInput): Promise<LoginResponseDto> {
    return this.http.post<LoginResponseDto>(
      '/auth/2fa/verificar',
      params,
      { skipAuthRefresh: true },
    );
  }

  /**
   * Verifica si existe una sesión activa y válida consultando /auth/verificar.
   * Si la cookie HttpOnly access_token es válida, devuelve el perfil y permisos frescos.
   * Si la sesión no es válida o expiró, devuelve null sin lanzar error.
   */
  public async verificarSesion(): Promise<SesionCompleta | null> {
    try {
      const res = await this.http.get<{
        ok: boolean;
        message: string;
        usuarioId: string;
        rolId: number;
        permisos: string[];
      }>('/auth/verificar');

      if (!res || !res.ok) {
        return null;
      }

      return {
        usuario: {
          id: res.usuarioId,
          email: '',
          rolId: res.rolId,
          rolNombre: ROL_NOMBRES[res.rolId] || 'usuario',
        },
        permisos: res.permisos || [],
      };
    } catch {
      return null;
    }
  }

  /**
   * Cierra la sesión en el backend y limpia las cookies HttpOnly.
   * Es idempotente: garantiza la desconexión incluso ante fallos de red.
   */
  public async logout(): Promise<void> {
    try {
      await this.http.post<{ success: boolean }>(
        '/auth/logout',
        {},
        { skipAuthRefresh: true },
      );
    } catch {
      // Idempotente por diseño
    }
  }

  /**
   * Solicita el envío de correo para recuperación de contraseña.
   */
  public async solicitarRecuperacionPassword(
    input: SolicitarRecuperacionPasswordInput,
  ): Promise<{ message: string }> {
    return this.http.post<{ message: string }>(
      '/auth/recuperar-password/solicitar',
      input,
      { skipAuthRefresh: true },
    );
  }

  /**
   * Valida si un token de reseteo recibido por URL sigue activo en la base de datos.
   */
  public async validarTokenPasswordReset(token: string): Promise<boolean> {
    try {
      await this.http.get(
        '/auth/recuperar-password/validar',
        {
          params: { token },
          skipAuthRefresh: true,
        },
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Restablece la contraseña utilizando el token de un solo uso validado.
   */
  public async restablecerPassword(
    input: ConfirmarRestablecerPasswordInput,
  ): Promise<{ message: string }> {
    return this.http.post<{ message: string }>(
      '/auth/recuperar-password/restablecer',
      input,
      { skipAuthRefresh: true },
    );
  }
}

/** Instancia singleton del servicio de autenticación lista para consumo */
export const authService = new AuthService();
