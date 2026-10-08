import { Result, DomainError } from '@warengine/shared-kernel';
import { IGestionUsuarioRepository } from '../../domain/repositories/IGestionUsuarioRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { UsuarioGestionado } from '../../domain/entities/UsuarioGestionado.ts';
import {
  UsuarioNoEncontradoError,
  UltimoSuperAdminError,
} from '../../domain/errors/AdministracionErrors.ts';

export interface CambiarEstadoUsuarioRequest {
  usuarioId: string;
  isActive: boolean;
  actor: ActorAuditoria;
}

export type CambiarEstadoUsuarioResponse = Result<UsuarioGestionado, DomainError>;

export class CambiarEstadoUsuarioUseCase {
  constructor(
    private readonly usuarioRepository: IGestionUsuarioRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: CambiarEstadoUsuarioRequest): Promise<CambiarEstadoUsuarioResponse> {
    const usuario = await this.usuarioRepository.findById(request.usuarioId);
    if (!usuario) return Result.fail(new UsuarioNoEncontradoError());

    if (usuario.isActive === request.isActive) return Result.ok(usuario);

    if (!request.isActive && usuario.esSuperAdmin) {
      const total = await this.usuarioRepository.contarSuperAdminsActivos();
      if (total <= 1) return Result.fail(new UltimoSuperAdminError());
    }

    await this.usuarioRepository.actualizarEstado(usuario.id, request.isActive, new Date());

    await this.auditor.registrar({
      actor: request.actor,
      accion: request.isActive ? ACCIONES_AUDITORIA.ACTIVAR : ACCIONES_AUDITORIA.INACTIVAR,
      entidad: ENTIDADES_AUDITORIA.USUARIOS,
      entidadId: usuario.id,
      detalles: { antes: { isActive: usuario.isActive }, despues: { isActive: request.isActive } },
    });

    const actualizado = await this.usuarioRepository.findById(usuario.id);
    return Result.ok(actualizado ?? usuario);
  }
}