/**
 * ObtenerEmpleadoPorIdUseCase.ts
 *
 * Caso de uso para obtener el detalle de un empleado por su identificador único (UUID).
 *
 * Rol en la arquitectura:
 * - Capa de Aplicación.
 * - Retorna la ficha laboral del colaborador con los nombres legibles de sucursal y área.
 *
 * Requisito SRS:
 * - RF-ADM-C5 / RF-ADM-C12: Consulta de datos laborales de personal.
 */

import { DomainError, Result } from '@warengine/shared-kernel';
import { Empleado } from '../../domain/entities/Empleado.ts';
import { IEmpleadoRepository } from '../../domain/repositories/IEmpleadoRepository.ts';
import { EmpleadoNoEncontradoError } from '../../domain/errors/AdministracionErrors.ts';

export interface ObtenerEmpleadoPorIdRequest {
  id: string;
}

export type ObtenerEmpleadoPorIdResponse = Result<Empleado, DomainError>;

export class ObtenerEmpleadoPorIdUseCase {
  constructor(private readonly empleadoRepository: IEmpleadoRepository) {}

  public async execute(
    request: ObtenerEmpleadoPorIdRequest,
  ): Promise<ObtenerEmpleadoPorIdResponse> {
    const empleado = await this.empleadoRepository.findById(request.id);
    if (!empleado) {
      return Result.fail(new EmpleadoNoEncontradoError());
    }

    return Result.ok(empleado);
  }
}
