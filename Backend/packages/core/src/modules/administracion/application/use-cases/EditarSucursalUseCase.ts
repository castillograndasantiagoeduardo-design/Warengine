import { Result, DomainError } from '@warengine/shared-kernel';
import { ISucursalRepository } from '../../domain/repositories/ISucursalRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import { Sucursal } from '../../domain/entities/Sucursal.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import {
  SedePrincipalNoInactivableError,
  SucursalNoEncontradaError,
  SucursalTieneUsuariosActivosError,
} from '../../domain/errors/AdministracionErrors.ts';

export interface EditarSucursalRequest {
  id: number;
  nombre?: string;
  direccion?: string;
  contacto?: string;
  isActive?: boolean;
  actor: ActorAuditoria;
}

export type EditarSucursalResponse = Result<Sucursal, DomainError>;

export class EditarSucursalUseCase {
  constructor(
    private readonly sucursalRepository: ISucursalRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: EditarSucursalRequest): Promise<EditarSucursalResponse> {
    const existente = await this.sucursalRepository.findById(request.id);
    if (!existente) {
      return Result.fail(new SucursalNoEncontradaError());
    }

    // RF-ADM-C17 / Regla 6: Restricciones de inactivación de sucursales
    if (request.isActive === false && existente.isActive) {
      if (request.id === 1) {
        return Result.fail(new SedePrincipalNoInactivableError());
      }
      const usuariosActivos = this.sucursalRepository.contarUsuariosActivos
        ? await this.sucursalRepository.contarUsuariosActivos(request.id)
        : 0;
      if (usuariosActivos > 0) {
        return Result.fail(new SucursalTieneUsuariosActivosError(usuariosActivos));
      }
    }

    const { id, actor, ...cambios } = request;
    const actualizada = await this.sucursalRepository.actualizar(id, cambios);

    // Solo se auditan los campos que realmente vinieron en la petición.
    const claves = (Object.keys(cambios) as Array<keyof typeof cambios>)
      .filter((clave) => cambios[clave] !== undefined);
    const antes: Record<string, unknown> = {};
    const despues: Record<string, unknown> = {};
    for (const clave of claves) {
      antes[clave] = existente[clave];
      despues[clave] = actualizada[clave];
    }

    await this.auditor.registrar({
      actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.SUCURSALES,
      entidadId: String(id),
      detalles: { antes, despues },
    });

    return Result.ok(actualizada);
  }
}