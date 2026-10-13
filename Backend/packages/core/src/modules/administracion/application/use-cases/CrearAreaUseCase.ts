/**
 * CrearAreaUseCase.ts
 *
 * Caso de uso para registrar una nueva área funcional dentro de una sucursal.
 *
 * Rol en la arquitectura:
 * - Capa de Aplicación.
 * - Valida existencia y estado de la sucursal, comprueba unicidad del nombre dentro de la misma
 *   y emite un evento de auditoría estructurado.
 *
 * Requisito SRS:
 * - RF-ADM-C4: Creación de áreas por sucursal con validación de no duplicidad.
 * - RNF-ADM-02: Registro auditable de mutaciones operativas.
 */

import { DomainError, Result } from '@warengine/shared-kernel';
import { Area } from '../../domain/entities/Area.ts';
import { IAreaRepository } from '../../domain/repositories/IAreaRepository.ts';
import { ISucursalRepository } from '../../domain/repositories/ISucursalRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import {
  AreaDuplicadaError,
  SucursalInactivaError,
  SucursalNoEncontradaError,
} from '../../domain/errors/AdministracionErrors.ts';

export interface CrearAreaRequest {
  sucursalId: number;
  nombre: string;
  actor: ActorAuditoria;
}

export type CrearAreaResponse = Result<Area, DomainError>;

export class CrearAreaUseCase {
  constructor(
    private readonly areaRepository: IAreaRepository,
    private readonly sucursalRepository: ISucursalRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: CrearAreaRequest): Promise<CrearAreaResponse> {
    const sucursal = await this.sucursalRepository.findById(request.sucursalId);
    if (!sucursal) {
      return Result.fail(new SucursalNoEncontradaError());
    }

    if (!sucursal.isActive) {
      return Result.fail(new SucursalInactivaError());
    }

    const nombreLimpio = request.nombre.trim();
    const duplicada = await this.areaRepository.findByNombreYSucursal(
      nombreLimpio,
      request.sucursalId,
    );
    if (duplicada) {
      return Result.fail(new AreaDuplicadaError(nombreLimpio));
    }

    const area = await this.areaRepository.crear({
      nombre: nombreLimpio,
      sucursalId: request.sucursalId,
    });

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.CREAR,
      entidad: ENTIDADES_AUDITORIA.AREAS,
      entidadId: String(area.id),
      detalles: {
        despues: {
          id: area.id,
          nombre: area.nombre,
          sucursalId: area.sucursalId,
        },
      },
    });

    return Result.ok(area);
  }
}
