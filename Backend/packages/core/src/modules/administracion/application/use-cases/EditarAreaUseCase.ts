/**
 * EditarAreaUseCase.ts
 *
 * Caso de uso para actualizar la denominación de un área operativa existente.
 *
 * Rol en la arquitectura:
 * - Capa de Aplicación.
 * - Verifica la existencia del área, controla la unicidad del nuevo nombre en la misma sucursal
 *   y registra auditoría diferencial.
 *
 * Requisito SRS:
 * - RF-ADM-C4: Modificación de áreas funcionales de sucursales.
 * - RNF-ADM-02: Registro auditable de mutaciones.
 */

import { DomainError, Result } from '@warengine/shared-kernel';
import { Area } from '../../domain/entities/Area.ts';
import { IAreaRepository } from '../../domain/repositories/IAreaRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import {
  AreaDuplicadaError,
  AreaNoEncontradaError,
} from '../../domain/errors/AdministracionErrors.ts';

export interface EditarAreaRequest {
  id: number;
  nombre: string;
  actor: ActorAuditoria;
}

export type EditarAreaResponse = Result<Area, DomainError>;

export class EditarAreaUseCase {
  constructor(
    private readonly areaRepository: IAreaRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: EditarAreaRequest): Promise<EditarAreaResponse> {
    const area = await this.areaRepository.findById(request.id);
    if (!area) {
      return Result.fail(new AreaNoEncontradaError());
    }

    const nuevoNombre = request.nombre.trim();
    if (area.nombre.toLowerCase() === nuevoNombre.toLowerCase()) {
      return Result.ok(area);
    }

    const existente = await this.areaRepository.findByNombreYSucursal(
      nuevoNombre,
      area.sucursalId,
    );
    if (existente && existente.id !== area.id) {
      return Result.fail(new AreaDuplicadaError(nuevoNombre));
    }

    const areaActualizada = await this.areaRepository.actualizar(area.id, {
      nombre: nuevoNombre,
    });

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.AREAS,
      entidadId: String(area.id),
      detalles: {
        antes: { nombre: area.nombre },
        despues: { nombre: areaActualizada.nombre },
      },
    });

    return Result.ok(areaActualizada);
  }
}
