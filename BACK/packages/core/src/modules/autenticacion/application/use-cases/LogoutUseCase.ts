import { Result, DomainError } from '@warengine/shared-kernel';
import { ITokenService } from '../../domain/services/ITokenService.ts';

export interface LogoutRequest {
  refreshToken?: string | null;
}

export type LogoutResponse = Result<void, DomainError>;

/**
 * LogoutUseCase — Caso de uso para revocar la sesión actual (RF-SA-G1).
 *
 * NOTA DE SEGURIDAD / ARQUITECTURA:
 * 1. El logout revoca exclusivamente el refresh token de la sesión actual en la base de datos.
 * 2. Es idempotente: si el token no viene provisto, es desconocido o ya fue revocado, devuelve éxito.
 * 3. No se audita en logs_auditoria (ADR 0002, sección 6: operaciones de sesión no son mutaciones de negocio).
 * 4. No invalida todas las sesiones del usuario con tokens_invalidados_en: solo la sesión actual.
 * 5. El access token (15 minutos) sigue siendo válido hasta expirar de forma natural porque es stateless.
 */
export class LogoutUseCase {
  constructor(private readonly tokenService: ITokenService) {}

  public async execute(request: LogoutRequest): Promise<LogoutResponse> {
    const token = request.refreshToken?.trim();

    if (!token) {
      return Result.ok(undefined);
    }

    try {
      await this.tokenService.revocarRefreshToken(token);
    } catch (_error) {
      // Idempotencia: ante cualquier fallo técnico o token inexistente/revocado, se devuelve éxito.
    }

    return Result.ok(undefined);
  }
}
