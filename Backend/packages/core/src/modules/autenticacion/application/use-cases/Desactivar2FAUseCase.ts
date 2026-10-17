import { Result, DomainError } from '@warengine/shared-kernel';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.ts';
import { IPasswordService } from '../../domain/services/IPasswordService.ts';
import {
  CredencialesInvalidasError,
  UsuarioInactivoError,
  TokenInvalidoError,
} from '../../domain/errors/AutenticacionErrors.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface Desactivar2FARequest {
  usuarioId: string;
  passwordConfirmacion: string;
  actor?: ActorAuditoria;
}

export interface Desactivar2FAOutput {
  mensaje: string;
}

export type Desactivar2FAResponse = Result<Desactivar2FAOutput, DomainError>;

export class Desactivar2FAUseCase {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly passwordService: IPasswordService,
    private readonly auditor?: IAuditor,
  ) {}

  public async execute(request: Desactivar2FARequest): Promise<Desactivar2FAResponse> {
    const usuario = await this.usuarioRepository.findById(request.usuarioId);

    if (!usuario) {
      return Result.fail(new TokenInvalidoError('Usuario no encontrado'));
    }

    if (!usuario.isActive) {
      return Result.fail(new UsuarioInactivoError());
    }

    const isPasswordValid = await this.passwordService.comparar(
      request.passwordConfirmacion,
      usuario.passwordHash,
    );
    if (!isPasswordValid) {
      return Result.fail(new CredencialesInvalidasError());
    }

    if (this.usuarioRepository.actualizarTotp) {
      await this.usuarioRepository.actualizarTotp(usuario.id, null, false);
    }

    if (this.auditor && request.actor) {
      await this.auditor.registrar({
        actor: request.actor,
        accion: 'usuario_2fa_desactivado',
        entidad: 'usuario',
        entidadId: usuario.id,
        detalles: {
          email: usuario.email,
        },
      });
    }

    return Result.ok({
      mensaje: 'Autenticación de dos factores (2FA) desactivada correctamente.',
    });
  }
}
