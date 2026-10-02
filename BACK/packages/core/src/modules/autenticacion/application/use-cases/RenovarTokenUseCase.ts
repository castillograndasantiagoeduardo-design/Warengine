import { Result, DomainError } from '@warengine/shared-kernel';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.ts';
import { ITokenService, AuthTokens } from '../../domain/services/ITokenService.ts';
import { TokenInvalidoError, UsuarioInactivoError } from '../../domain/errors/AutenticacionErrors.ts';

export interface RenovarTokenRequest {
  refreshToken: string;
}

export type RenovarTokenResponse = Result<AuthTokens, DomainError>;

export class RenovarTokenUseCase {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly usuarioRepository: IUsuarioRepository
  ) {}

  public async execute(request: RenovarTokenRequest): Promise<RenovarTokenResponse> {
    try {
      const payload = await this.tokenService.validarRefreshToken(request.refreshToken);
      
      const usuario = await this.usuarioRepository.findById(payload.usuarioId);
      
      if (!usuario) {
        return Result.fail(new TokenInvalidoError('El usuario asociado no existe.'));
      }
      
      if (!usuario.isActive) {
        return Result.fail(new UsuarioInactivoError());
      }
      
      // Revocar el refresh token actual (rotación de refresh tokens)
      await this.tokenService.revocarRefreshToken(request.refreshToken);

      // Generar nuevo par
      const tokens = await this.tokenService.generarTokens(usuario.id, usuario.rolId);
      return Result.ok(tokens);
    } catch (_e) {
      return Result.fail(new TokenInvalidoError('Refresh token inválido o expirado.'));
    }
  }
}
