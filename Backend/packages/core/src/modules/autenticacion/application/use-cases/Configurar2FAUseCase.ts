import { Result, DomainError } from '@warengine/shared-kernel';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.ts';
import { ITotpService, GenerarSecretoTotpOutput } from '../../domain/services/ITotpService.ts';
import { UsuarioInactivoError, TokenInvalidoError } from '../../domain/errors/AutenticacionErrors.ts';

export interface Configurar2FARequest {
  usuarioId: string;
}

export type Configurar2FAResponse = Result<GenerarSecretoTotpOutput, DomainError>;

export class Configurar2FAUseCase {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly totpService: ITotpService,
  ) {}

  public async execute(request: Configurar2FARequest): Promise<Configurar2FAResponse> {
    const usuario = await this.usuarioRepository.findById(request.usuarioId);

    if (!usuario) {
      return Result.fail(new TokenInvalidoError('Usuario no encontrado'));
    }

    if (!usuario.isActive) {
      return Result.fail(new UsuarioInactivoError());
    }

    const { secretBase32, otpauthUrl } = this.totpService.generarSecreto(usuario.email);

    return Result.ok({
      secretBase32,
      otpauthUrl,
    });
  }
}
