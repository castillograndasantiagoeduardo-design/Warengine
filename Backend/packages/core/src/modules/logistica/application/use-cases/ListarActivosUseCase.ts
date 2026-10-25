import { Result, DomainError, ResultadoPaginado } from '@warengine/shared-kernel';
import { Activo, EstadoActivo } from '../../domain/entities/Activo.ts';
import { IActivoRepository } from '../../domain/repositories/IActivoRepository.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';

export interface ListarActivosRequest {
  usuarioId: string;
  sucursalId?: number;
  categoriaActivoId?: number;
  areaId?: number;
  estado?: EstadoActivo;
  busqueda?: string;
  page: number;
  limit: number;
}

export type ListarActivosResponse = Result<ResultadoPaginado<Activo>, DomainError>;

export class ListarActivosUseCase {
  constructor(
    private readonly activoRepository: IActivoRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(request: ListarActivosRequest): Promise<ListarActivosResponse> {
    const alcanceResult = await this.resolverAlcance.execute({ usuarioId: request.usuarioId });
    if (alcanceResult.isFailure) {
      return Result.fail(alcanceResult.error);
    }

    const alcance = alcanceResult.value;
    let sucursalIds: number[] | undefined;

    if (request.sucursalId !== undefined) {
      if (!alcance.permite(request.sucursalId)) {
        return Result.fail(new SucursalFueraDeAlcanceError());
      }
      sucursalIds = [request.sucursalId];
    } else {
      sucursalIds = alcance.sucursalesPermitidas();
    }

    if (sucursalIds !== undefined && sucursalIds.length === 0) {
      return Result.ok({ items: [], total: 0, page: request.page, limit: request.limit, totalPages: 1 });
    }

    const resultado = await this.activoRepository.listar({
      sucursalIds,
      categoriaActivoId: request.categoriaActivoId,
      areaId: request.areaId,
      estado: request.estado,
      busqueda: request.busqueda,
      page: request.page,
      limit: request.limit,
    });

    return Result.ok(resultado);
  }
}
