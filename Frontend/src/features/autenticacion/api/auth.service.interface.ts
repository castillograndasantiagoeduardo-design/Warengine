/**
 * auth.service.interface.ts — Puerto (Interface) del servicio de autenticación.
 *
 * Principios SOLID aplicados:
 * - Interface Segregation Principle (ISP): Contrato claro y conciso con los
 *   métodos necesarios para la autenticación perimetral.
 * - Dependency Inversion Principle (DIP): Los componentes y hooks de React
 *   dependen de esta abstracción, facilitando pruebas unitarias y mocks.
 */

import type {
  LoginInput,
  LoginResult,
  LoginResponseDto,
  Verificar2faLoginInput,
  SesionCompleta,
  SolicitarRecuperacionPasswordInput,
  ConfirmarRestablecerPasswordInput,
} from '../types/auth.types';

export interface IAuthService {
  /**
   * Inicia sesión con correo y contraseña.
   * Si el usuario requiere 2FA, retorna un resultado con tipo 'REQUIERE_2FA' y el tempToken.
   */
  login(credentials: LoginInput): Promise<LoginResult>;

  /**
   * Completa el inicio de sesión enviando el código TOTP de 6 dígitos junto con el tempToken.
   */
  verificar2FA(params: Verificar2faLoginInput): Promise<LoginResponseDto>;

  /**
   * Consulta la sesión activa del usuario verificando la cookie HttpOnly en el backend.
   * Retorna los datos del usuario y sus permisos, o null si no hay sesión válida.
   */
  verificarSesion(): Promise<SesionCompleta | null>;

  /**
   * Cierra la sesión en el backend, revocando el token de refresco y limpiando las cookies HttpOnly.
   */
  logout(): Promise<void>;

  /**
   * Solicita el envío de un correo electrónico para restablecer la contraseña.
   */
  solicitarRecuperacionPassword(
    input: SolicitarRecuperacionPasswordInput,
  ): Promise<{ message: string }>;

  /**
   * Valida si un token de restablecimiento de contraseña sigue vigente y no ha expirado.
   */
  validarTokenPasswordReset(token: string): Promise<boolean>;

  /**
   * Aplica la nueva contraseña en el backend utilizando el token de restablecimiento validado.
   */
  restablecerPassword(
    input: ConfirmarRestablecerPasswordInput,
  ): Promise<{ message: string }>;
}
