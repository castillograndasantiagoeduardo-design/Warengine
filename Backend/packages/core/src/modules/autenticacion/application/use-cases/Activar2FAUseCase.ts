import { Result, DomainError } from '@warengine/shared-kernel';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.ts';
import { ITotpService } from '../../domain/services/ITotpService.ts';
import {
  CodigoTotpInvalidoError,
  UsuarioInactivoError,
  TokenInvalidoError,
} from '../../domain/errors/AutenticacionErrors.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface Activar2FARequest {
  usuarioId: string;
  secretBase32: string;
  codigoTotp: string;
  actor?: ActorAuditoria;
}

export interface Activar2FAOutput {
  mensaje: string;
}

export type Activar2FAResponse = Result<Activar2FAOutput, DomainError>;

export class Activar2FAUseCase {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly totpService: ITotpService,
    private readonly auditor?: IAuditor,
  ) {}

  public async execute(request: Activar2FARequest): Promise<Activar2FAResponse> {
    const usuario = await this.usuarioRepository.findById(request.usuarioId);

    if (!usuario) {
      return Result.fail(new TokenInvalidoError('Usuario no encontrado'));
    }

    if (!usuario.isActive) {
      return Result.fail(new UsuarioInactivoError());
    }

    const esValido = await this.totpService.validarCodigo(request.secretBase32, request.codigoTotp);
    if (!esValido) {
      return Result.fail(new CodigoTotpInvalidoError());
    }

    if (this.usuarioRepository.actualizarTotp) {
      await this.usuarioRepository.actualizarTotp(usuario.id, request.secretBase32, true);
    }

    if (this.auditor && request.actor) {
      await this.auditor.registrar({
        actor: request.actor,
        accion: 'usuario_2fa_activado',
        entidad: 'usuario',
        entidadId: usuario.id,
        detalles: {
          email: usuario.email,
        },
      });
    }

    return Result.ok({
      mensaje: 'Autenticación de dos factores (2FA) activada correctamente.',
    });
  }
}
