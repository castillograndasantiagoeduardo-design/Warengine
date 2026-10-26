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
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { Empleado } from '../../domain/entities/Empleado.ts';
import { IEmpleadoRepository } from '../../domain/repositories/IEmpleadoRepository.ts';
import { EmpleadoNoEncontradoError } from '../../domain/errors/AdministracionErrors.ts';

export interface ObtenerEmpleadoPorIdRequest {
  id: string;
  /** Usuario que consulta: solo puede ver empleados de sedes en su alcance. */
  usuarioId: string;
}

export type ObtenerEmpleadoPorIdResponse = Result<Empleado, DomainError>;

export class ObtenerEmpleadoPorIdUseCase {
  constructor(
    private readonly empleadoRepository: IEmpleadoRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(
    request: ObtenerEmpleadoPorIdRequest,
  ): Promise<ObtenerEmpleadoPorIdResponse> {
    const empleado = await this.empleadoRepository.findById(request.id);
    if (!empleado) {
      return Result.fail(new EmpleadoNoEncontradoError());
    }

    const alcance = await this.resolverAlcance.execute({ usuarioId: request.usuarioId });
    if (alcance.isFailure) return Result.fail(alcance.error);
    if (!alcance.value.permite(empleado.sucursalId)) return Result.fail(new SucursalFueraDeAlcanceError());

    return Result.ok(empleado);
  }
}
