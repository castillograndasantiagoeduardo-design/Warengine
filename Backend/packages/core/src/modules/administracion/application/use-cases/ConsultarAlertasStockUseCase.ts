import { Result, DomainError, type ResultadoPaginado } from '@warengine/shared-kernel';
import { IAlertaStockRepository } from '../../domain/repositories/IAlertaStockRepository.ts';
import { AlertaStock } from '../../domain/entities/AlertaStock.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';

export interface ConsultarAlertasStockRequest {
  usuarioId: string;
  sucursalId?: number;
  page: number;
  limit: number;
}

export type ConsultarAlertasStockResponse = Result<ResultadoPaginado<AlertaStock>, DomainError>;

/**
 * RF-ADM-A6: alertas de agotamiento de stock, distinguiendo la sucursal.
 * RNF-ADM-04: el Super Admin ve todas las sucursales; el resto, solo las suyas.
 */
export class ConsultarAlertasStockUseCase {
  constructor(
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly alertaRepository: IAlertaStockRepository,
  ) {}

  public async execute(request: ConsultarAlertasStockRequest): Promise<ConsultarAlertasStockResponse> {
    const alcance = await this.resolverAlcance.execute({ usuarioId: request.usuarioId });
    if (alcance.isFailure) return Result.fail(alcance.error);

    let sucursalIds: number[] | undefined;
    if (request.sucursalId !== undefined) {
      if (!alcance.value.permite(request.sucursalId)) {
        return Result.fail(new SucursalFueraDeAlcanceError());
      }
      sucursalIds = [request.sucursalId];
    } else {
      sucursalIds = alcance.value.sucursalesPermitidas();
    }

    // Alcance limitado sin ninguna sucursal: no hay nada que mostrar (evita un IN () vacío).
    if (sucursalIds !== undefined && sucursalIds.length === 0) {
      return Result.ok({ items: [], total: 0, page: request.page, limit: request.limit, totalPages: 1 });
    }

    return Result.ok(
      await this.alertaRepository.listar({ sucursalIds, page: request.page, limit: request.limit }),
    );
  }
}