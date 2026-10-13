/**
 * EliminarAreaUseCase.ts
 *
 * Caso de uso para eliminar un área operativa que no tenga empleados asignados.
 *
 * Rol en la arquitectura:
 * - Capa de Aplicación.
 * - Protege la integridad referencial y operativa impidiendo eliminar áreas en uso,
 *   y emite un evento de auditoría.
 *
 * Requisito SRS:
 * - RF-ADM-C4: Eliminación controlada de áreas de sucursal.
 * - RNF-ADM-02: Registro auditable de mutaciones.
 */

import { DomainError, Result } from '@warengine/shared-kernel';
import { IAreaRepository } from '../../domain/repositories/IAreaRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import {
  AreaNoEncontradaError,
  AreaTieneEmpleadosError,
} from '../../domain/errors/AdministracionErrors.ts';

export interface EliminarAreaRequest {
  id: number;
  actor: ActorAuditoria;
}

export type EliminarAreaResponse = Result<void, DomainError>;

export class EliminarAreaUseCase {
  constructor(
    private readonly areaRepository: IAreaRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: EliminarAreaRequest): Promise<EliminarAreaResponse> {
    const area = await this.areaRepository.findById(request.id);
    if (!area) {
      return Result.fail(new AreaNoEncontradaError());
    }

    const empleadosAsignados = await this.areaRepository.contarEmpleadosEnArea(request.id);
    if (empleadosAsignados > 0) {
      return Result.fail(new AreaTieneEmpleadosError(empleadosAsignados));
    }

    await this.areaRepository.eliminar(request.id);

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.ELIMINAR,
      entidad: ENTIDADES_AUDITORIA.AREAS,
      entidadId: String(area.id),
      detalles: {
        antes: {
          id: area.id,
          nombre: area.nombre,
          sucursalId: area.sucursalId,
        },
      },
    });

    return Result.ok();
  }
}
