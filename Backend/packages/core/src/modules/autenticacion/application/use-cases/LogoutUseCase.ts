import { Result, DomainError } from '@warengine/shared-kernel';
import { ITokenService } from '../../domain/services/ITokenService.ts';

export interface LogoutRequest {
  refreshToken?: string | null;
}

export type LogoutResponse = Result<void, DomainError>;

export class LogoutUseCase {
  constructor(private readonly tokenService: ITokenService) {}

  public async execute(request: LogoutRequest): Promise<LogoutResponse> {
    // Si viene un refresh token, se revoca en base de datos.
    // El caso de uso es completamente idempotente: si el token no existe,
    // ya está revocado o no se envió, la operación se considera exitosa.
    if (request.refreshToken) {
      try {
        await this.tokenService.revocarRefreshToken(request.refreshToken);
      } catch (_e) {
        // Ignorar errores técnicos para mantener la idempotencia del cierre de sesión
      }
    }

    // Nota de seguridad arquitectónica (RF-SA-G1 / ADR 0002):
    // El access token (15 min) sigue siendo válido hasta expirar porque es stateless.
    // En el logout solo se revoca la sesión actual (el refresh token en BD) y NO se
    // invalidan todas las sesiones del usuario mediante tokens_invalidados_en.
    return Result.ok();
  }
}
