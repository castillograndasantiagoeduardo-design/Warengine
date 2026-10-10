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
  RolNoEncontradoError,
  UltimoSuperAdminError,
} from '../../domain/errors/AdministracionErrors.ts';

export interface CambiarRolUsuarioRequest {
  usuarioId: string;
  rolId: number;
  actor: ActorAuditoria;
}

export type CambiarRolUsuarioResponse = Result<UsuarioGestionado, DomainError>;

export class CambiarRolUsuarioUseCase {
  constructor(
    private readonly usuarioRepository: IGestionUsuarioRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: CambiarRolUsuarioRequest): Promise<CambiarRolUsuarioResponse> {
    const usuario = await this.usuarioRepository.findById(request.usuarioId);
    if (!usuario) return Result.fail(new UsuarioNoEncontradoError());

    if (usuario.rolId === request.rolId) return Result.ok(usuario);

    if (!(await this.usuarioRepository.rolExiste(request.rolId))) {
      return Result.fail(new RolNoEncontradoError());
    }

    // Evita dejar el sistema sin ningún Super Admin activo
    if (usuario.esSuperAdmin && usuario.isActive) {
      const total = await this.usuarioRepository.contarSuperAdminsActivos();
      if (total <= 1) return Result.fail(new UltimoSuperAdminError());
    }

    // RF-SEG: al cambiar el rol, los tokens anteriores dejan de ser válidos
    await this.usuarioRepository.actualizarRol(usuario.id, request.rolId, new Date());

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.CAMBIAR_ROL,
      entidad: ENTIDADES_AUDITORIA.USUARIOS,
      entidadId: usuario.id,
      detalles: { antes: { rolId: usuario.rolId }, despues: { rolId: request.rolId } },
    });

    const actualizado = await this.usuarioRepository.findById(usuario.id);
    return Result.ok(actualizado ?? usuario);
  }
}