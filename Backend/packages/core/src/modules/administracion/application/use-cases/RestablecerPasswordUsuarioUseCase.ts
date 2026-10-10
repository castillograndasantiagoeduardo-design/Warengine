import { Result, DomainError } from '@warengine/shared-kernel';
import { IPasswordService } from '../../../autenticacion/domain/services/IPasswordService.ts';
import { IGestionUsuarioRepository } from '../../domain/repositories/IGestionUsuarioRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { UsuarioNoEncontradoError } from '../../domain/errors/AdministracionErrors.ts';

export interface RestablecerPasswordUsuarioRequest {
  usuarioId: string;
  nuevaPassword: string;
  actor: ActorAuditoria;
}

export type RestablecerPasswordUsuarioResponse = Result<void, DomainError>;

/**
 * RF-ADM-C9: el Super Admin fuerza el restablecimiento de la contraseña de cualquier usuario.
 * Todas las sesiones abiertas del usuario (access y refresh tokens) quedan invalidadas.
 */
export class RestablecerPasswordUsuarioUseCase {
  constructor(
    private readonly usuarioRepository: IGestionUsuarioRepository,
    private readonly passwordService: IPasswordService,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(
    request: RestablecerPasswordUsuarioRequest,
  ): Promise<RestablecerPasswordUsuarioResponse> {
    const usuario = await this.usuarioRepository.findById(request.usuarioId);
    if (!usuario) return Result.fail(new UsuarioNoEncontradoError());

    const passwordHash = await this.passwordService.hashear(request.nuevaPassword);
    await this.usuarioRepository.actualizarPassword(usuario.id, passwordHash, new Date());

    // Nunca se registra la contraseña ni su hash: solo el hecho de que se restableció.
    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.RESTABLECER_PASSWORD,
      entidad: ENTIDADES_AUDITORIA.USUARIOS,
      entidadId: usuario.id,
      detalles: { despues: { credenciales: 'restablecidas', sesionesRevocadas: true } },
    });

    return Result.ok();
  }
}