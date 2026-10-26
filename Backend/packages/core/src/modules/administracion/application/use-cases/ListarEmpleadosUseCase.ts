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
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { Empleado } from '../../domain/entities/Empleado.ts';
import {
  FiltrosEmpleados,
  IEmpleadoRepository,
} from '../../domain/repositories/IEmpleadoRepository.ts';

/** `usuarioId` determina el alcance: el Super Admin ve todas las sedes; el resto, solo las suyas. */
export type ListarEmpleadosRequest = Omit<FiltrosEmpleados, 'sucursalIds'> & { usuarioId: string };
export type ListarEmpleadosResponse = Result<Empleado[], DomainError>;

export class ListarEmpleadosUseCase {
  constructor(
    private readonly empleadoRepository: IEmpleadoRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(request: ListarEmpleadosRequest): Promise<ListarEmpleadosResponse> {
    const { usuarioId, ...filtros } = request;
    const alcance = await this.resolverAlcance.execute({ usuarioId });
    if (alcance.isFailure) return Result.fail(alcance.error);

    if (filtros.sucursalId !== undefined && !alcance.value.permite(filtros.sucursalId)) {
      return Result.fail(new SucursalFueraDeAlcanceError());
    }

    const sucursalIds = alcance.value.sucursalesPermitidas();
    if (sucursalIds !== undefined && sucursalIds.length === 0) return Result.ok([]);

    const empleados = await this.empleadoRepository.listar({ ...filtros, sucursalIds });
    return Result.ok(empleados);
  }
}
