import { Result, DomainError, ResultadoPaginado } from '@warengine/shared-kernel';
import { TipoMantenimiento } from '../../domain/entities/MantenimientoActivo.ts';
import {
  IMantenimientoActivoRepository,
  MantenimientoActivoDetallado,
  ResumenMantenimientos,
} from '../../domain/repositories/IMantenimientoActivoRepository.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';

export interface ListarMantenimientosRequest {
  usuarioId: string;
  sucursalId?: number;
  activoId?: string;
  tipo?: TipoMantenimiento;
  estado?: 'todos' | 'en_curso' | 'finalizado';
  desde?: string;
  hasta?: string;
  page: number;
  limit: number;
}

export type ListarMantenimientosResultado = ResultadoPaginado<MantenimientoActivoDetallado> & {
  resumen?: ResumenMantenimientos;
};

export type ListarMantenimientosResponse = Result<ListarMantenimientosResultado, DomainError>;

export class ListarMantenimientosUseCase {
  constructor(
    private readonly mantenimientoRepository: IMantenimientoActivoRepository,
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(request: ListarMantenimientosRequest): Promise<ListarMantenimientosResponse> {
    const alcanceResult = await this.resolverAlcance.execute({ usuarioId: request.usuarioId });
    if (alcanceResult.isFailure) return Result.fail(alcanceResult.error);

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
      return Result.ok({
        items: [],
        total: 0,
        page: request.page,
        limit: request.limit,
        totalPages: 1,
      });
    }

    if (!this.mantenimientoRepository.listarPaginado) {
      throw new Error('Método listarPaginado no implementado en el repositorio de mantenimientos');
    }

    const resultado = await this.mantenimientoRepository.listarPaginado({
      sucursalIds,
      activoId: request.activoId,
      tipo: request.tipo,
      estado: request.estado,
      desde: request.desde,
      hasta: request.hasta,
      page: request.page,
      limit: request.limit,
    });

    let resumen: ResumenMantenimientos | undefined;
    if (this.mantenimientoRepository.obtenerResumen) {
      try {
        resumen = await this.mantenimientoRepository.obtenerResumen(sucursalIds);
      } catch {
        // Fallback resiliente
      }
    }

    return Result.ok({
      ...resultado,
      resumen,
    });
  }
}
