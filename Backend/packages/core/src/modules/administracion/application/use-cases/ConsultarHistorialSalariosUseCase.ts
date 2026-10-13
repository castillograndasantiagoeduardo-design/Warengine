/**
 * ConsultarHistorialSalariosUseCase.ts
 *
 * Caso de uso para consultar la trayectoria e historial salarial de un empleado.
 *
 * Rol en la arquitectura:
 * - Capa de Aplicación.
 * - Valida la existencia del colaborador y obtiene la lista cronológica de ajustes salariales.
 *
 * Requisito SRS:
 * - RF-ADM-C14: Historial de salarios de empleados.
 */

import { DomainError, Result } from '@warengine/shared-kernel';
import { HistorialSalario } from '../../domain/entities/HistorialSalario.ts';
import { IEmpleadoRepository } from '../../domain/repositories/IEmpleadoRepository.ts';
import { IHistorialSalarioRepository } from '../../domain/repositories/IHistorialSalarioRepository.ts';
import { EmpleadoNoEncontradoError } from '../../domain/errors/AdministracionErrors.ts';

export interface ConsultarHistorialSalariosRequest {
  empleadoId: string;
}

export type ConsultarHistorialSalariosResponse = Result<HistorialSalario[], DomainError>;

export class ConsultarHistorialSalariosUseCase {
  constructor(
    private readonly empleadoRepository: IEmpleadoRepository,
    private readonly historialSalarioRepository: IHistorialSalarioRepository,
  ) {}

  public async execute(
    request: ConsultarHistorialSalariosRequest,
  ): Promise<ConsultarHistorialSalariosResponse> {
    const empleado = await this.empleadoRepository.findById(request.empleadoId);
    if (!empleado) {
      return Result.fail(new EmpleadoNoEncontradoError());
    }

    const historial = await this.historialSalarioRepository.listarPorEmpleado(request.empleadoId);
    return Result.ok(historial);
  }
}
