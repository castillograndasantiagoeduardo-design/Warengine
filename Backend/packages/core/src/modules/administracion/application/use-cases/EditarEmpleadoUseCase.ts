/**
 * EditarEmpleadoUseCase.ts
 *
 * Caso de uso para la actualización independiente de la información laboral y de contacto de un empleado.
 *
 * Rol en la arquitectura:
 * - Capa de Aplicación.
 * - Valida existencia del empleado, asegura que el área asignada pertenezca a la misma sucursal
 *   del colaborador y genera un log de auditoría diferencial con los campos modificados.
 *
 * Requisito SRS:
 * - RF-ADM-C12: Edición independiente de datos de empleados (contacto, cargo y área).
 * - RNF-ADM-02: Registro inmutable en auditoría ante toda mutación de personal.
 */

import { DomainError, Result } from '@warengine/shared-kernel';
import { Empleado } from '../../domain/entities/Empleado.ts';
import { IEmpleadoRepository } from '../../domain/repositories/IEmpleadoRepository.ts';
import { IAreaRepository } from '../../domain/repositories/IAreaRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import {
  AreaNoEncontradaError,
  AreaNoPerteneceASucursalError,
  EmpleadoNoEncontradoError,
} from '../../domain/errors/AdministracionErrors.ts';

export interface EditarEmpleadoRequest {
  id: string;
  nombre?: string;
  telefono?: string | null;
  direccion?: string | null;
  cargo?: string | null;
  areaId?: number | null;
  isActive?: boolean;
  actor: ActorAuditoria;
}

export type EditarEmpleadoResponse = Result<Empleado, DomainError>;

export class EditarEmpleadoUseCase {
  constructor(
    private readonly empleadoRepository: IEmpleadoRepository,
    private readonly areaRepository: IAreaRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: EditarEmpleadoRequest): Promise<EditarEmpleadoResponse> {
    const empleadoActual = await this.empleadoRepository.findById(request.id);
    if (!empleadoActual) {
      return Result.fail(new EmpleadoNoEncontradoError());
    }

    // Regla de negocio: Si se asigna un área, debe pertenecer a la misma sucursal del empleado
    if (request.areaId !== undefined && request.areaId !== null) {
      const area = await this.areaRepository.findById(request.areaId);
      if (!area) {
        return Result.fail(new AreaNoEncontradaError());
      }
      if (area.sucursalId !== empleadoActual.sucursalId) {
        return Result.fail(new AreaNoPerteneceASucursalError());
      }
    }

    // Construcción de diferencias para auditoría
    const antes: Record<string, unknown> = {};
    const despues: Record<string, unknown> = {};

    if (request.nombre !== undefined && request.nombre.trim() !== empleadoActual.nombre) {
      antes.nombre = empleadoActual.nombre;
      despues.nombre = request.nombre.trim();
    }
    if (request.telefono !== undefined && request.telefono !== empleadoActual.telefono) {
      antes.telefono = empleadoActual.telefono;
      despues.telefono = request.telefono;
    }
    if (request.direccion !== undefined && request.direccion !== empleadoActual.direccion) {
      antes.direccion = empleadoActual.direccion;
      despues.direccion = request.direccion;
    }
    if (request.cargo !== undefined && request.cargo !== empleadoActual.cargo) {
      antes.cargo = empleadoActual.cargo;
      despues.cargo = request.cargo;
    }
    if (request.areaId !== undefined && request.areaId !== empleadoActual.areaId) {
      antes.areaId = empleadoActual.areaId;
      despues.areaId = request.areaId;
    }
    if (request.isActive !== undefined && request.isActive !== empleadoActual.isActive) {
      antes.isActive = empleadoActual.isActive;
      despues.isActive = request.isActive;
    }

    // Si no hay cambios reales en los datos, retornamos el empleado sin emitir log
    if (Object.keys(despues).length === 0) {
      return Result.ok(empleadoActual);
    }

    const empleadoActualizado = await this.empleadoRepository.actualizarDatos(request.id, {
      nombre: request.nombre ? request.nombre.trim() : undefined,
      telefono: request.telefono,
      direccion: request.direccion,
      cargo: request.cargo,
      areaId: request.areaId,
      isActive: request.isActive,
    });

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.EMPLEADOS,
      entidadId: request.id,
      detalles: { antes, despues },
    });

    return Result.ok(empleadoActualizado);
  }
}
