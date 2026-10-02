import { Result, DomainError } from '@warengine/shared-kernel';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.ts';
import { IPasswordService } from '../../domain/services/IPasswordService.ts';
import { ITokenService, AuthTokens } from '../../domain/services/ITokenService.ts';
import { CredencialesInvalidasError, UsuarioInactivoError, Requiere2FAError } from '../../domain/errors/AutenticacionErrors.ts';

export interface LoginRequest {
  email: string;
  passwordPlain: string;
}

export type LoginResponse = Result<AuthTokens, DomainError>;

export class LoginUseCase {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService
  ) {}

  public async execute(request: LoginRequest): Promise<LoginResponse> {
    const usuario = await this.usuarioRepository.findByEmail(request.email);
    
    if (!usuario) {
      return Result.fail(new CredencialesInvalidasError());
    }

    if (!usuario.isActive) {
      return Result.fail(new UsuarioInactivoError());
    }

    const isPasswordValid = await this.passwordService.comparar(request.passwordPlain, usuario.passwordHash);
    if (!isPasswordValid) {
      return Result.fail(new CredencialesInvalidasError());
    }

    if (usuario.requiere2fa) {
      // Nota: Aquí se implementaría flujo 2FA si corresponde.
      return Result.fail(new Requiere2FAError());
    }

    const tokens = await this.tokenService.generarTokens(usuario.id, usuario.rolId);
    return Result.ok(tokens);
  }
}
