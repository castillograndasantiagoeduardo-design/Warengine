/**
 * ListarEmpleadosUseCase.ts
 *
 * Caso de uso para listar empleados con filtros combinables (sucursal, área, estado).
 *
 * Rol en la arquitectura:
 * - Capa de Aplicación.
 * - Recupera el listado de colaboradores para visualización y asignación administrativa.
 *
 * Requisito SRS:
 * - RF-ADM-C5: Listado de usuarios/empleados con filtros.
 */

import { DomainError, Result } from '@warengine/shared-kernel';
import { Empleado } from '../../domain/entities/Empleado.ts';
import {
  FiltrosEmpleados,
  IEmpleadoRepository,
} from '../../domain/repositories/IEmpleadoRepository.ts';

export type ListarEmpleadosRequest = FiltrosEmpleados;
export type ListarEmpleadosResponse = Result<Empleado[], DomainError>;

export class ListarEmpleadosUseCase {
  constructor(private readonly empleadoRepository: IEmpleadoRepository) {}

  public async execute(request: ListarEmpleadosRequest = {}): Promise<ListarEmpleadosResponse> {
    const empleados = await this.empleadoRepository.listar(request);
    return Result.ok(empleados);
  }
}
