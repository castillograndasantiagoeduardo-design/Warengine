/**
 * ListarEmpleadosUseCase.ts
 *
 * Caso de uso para listar empleados con filtros combinables (sucursal, área, estado, búsqueda, cargo, paginación).
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
  EmpleadosPaginadosResultado,
  FiltrosEmpleados,
  IEmpleadoRepository,
} from '../../domain/repositories/IEmpleadoRepository.ts';

/** `usuarioId` determina el alcance: el Super Admin ve todas las sedes; el resto, solo las suyas. */
export type ListarEmpleadosRequest = Omit<FiltrosEmpleados, 'sucursalIds'> & { usuarioId: string };
export type ListarEmpleadosResponse = Result<Empleado[] | EmpleadosPaginadosResultado, DomainError>;

export class ListarEmpleadosUseCase {
  constructor(
    private readonly empleadoRepository: IEmpleadoRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(
    request: ListarEmpleadosRequest & { page: number },
  ): Promise<Result<EmpleadosPaginadosResultado, DomainError>>;
  public async execute(
    request: ListarEmpleadosRequest,
  ): Promise<Result<Empleado[], DomainError>>;
  public async execute(
    request: ListarEmpleadosRequest,
  ): Promise<Result<Empleado[] | EmpleadosPaginadosResultado, DomainError>> {
    const { usuarioId, ...filtros } = request;
    const alcance = await this.resolverAlcance.execute({ usuarioId });
    if (alcance.isFailure) return Result.fail(alcance.error);

    if (filtros.sucursalId !== undefined && !alcance.value.permite(filtros.sucursalId)) {
      return Result.fail(new SucursalFueraDeAlcanceError());
    }

    const sucursalIds = alcance.value.sucursalesPermitidas();
    if (sucursalIds !== undefined && sucursalIds.length === 0) {
      if (filtros.page !== undefined) {
        return Result.ok({
          items: [],
          total: 0,
          totalPaginas: 0,
          page: filtros.page,
          limite: filtros.limite ?? 20,
        });
      }
      return Result.ok([]);
    }

    if (filtros.page !== undefined) {
      if (this.empleadoRepository.listarPaginado) {
        const resultado = await this.empleadoRepository.listarPaginado({ ...filtros, sucursalIds });
        return Result.ok(resultado);
      }
      const todos = await this.empleadoRepository.listar({ ...filtros, sucursalIds });
      const limite = filtros.limite ?? 20;
      const page = filtros.page ?? 1;
      const total = todos.length;
      const totalPaginas = Math.ceil(total / limite);
      const items = todos.slice((page - 1) * limite, page * limite);
      return Result.ok({ items, total, totalPaginas, page, limite });
    }

    const empleados = await this.empleadoRepository.listar({ ...filtros, sucursalIds });
    return Result.ok(empleados);
  }
}
