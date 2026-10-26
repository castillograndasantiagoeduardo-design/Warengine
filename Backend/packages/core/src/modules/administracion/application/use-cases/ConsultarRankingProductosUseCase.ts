import { DomainError, Result } from '@warengine/shared-kernel';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import {
  SucursalFueraDeAlcanceError,
  SucursalRequeridaError,
} from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { RangoFechasInvalidoError } from '../../domain/errors/AdministracionErrors.ts';
import type {
  IMetricasAdminRepository,
  ItemRankingProducto,
} from '../../domain/repositories/IMetricasAdminRepository.ts';

export interface ConsultarRankingProductosRequest {
  usuarioId: string;
  orden: 'mas_vendidos' | 'menos_vendidos';
  limite?: number;
  sucursalId?: number;
  desde?: Date;
  hasta?: Date;
}

export type ConsultarRankingProductosResponse = Result<ItemRankingProducto[], DomainError>;

/**
 * RF-ADM-A4: Indicador de producto más y menos vendido global y por sucursal.
 * RNF-ADM-04: Super Admin visibilidad transversal; Admin de Sucursal solo su sede.
 */
export class ConsultarRankingProductosUseCase {
  constructor(
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly metricasRepository: IMetricasAdminRepository,
  ) {}

  public async execute(request: ConsultarRankingProductosRequest): Promise<ConsultarRankingProductosResponse> {
    if (request.desde && request.hasta && request.desde > request.hasta) {
      return Result.fail(new RangoFechasInvalidoError());
    }

    const alcance = await this.resolverAlcance.execute({ usuarioId: request.usuarioId });
    if (alcance.isFailure) return Result.fail(alcance.error);

    let sucursalId = request.sucursalId;

    if (sucursalId !== undefined) {
      if (!alcance.value.permite(sucursalId)) {
        return Result.fail(new SucursalFueraDeAlcanceError());
      }
    } else if (!alcance.value.esGlobal) {
      const permitidas = alcance.value.sucursalesPermitidas();
      if (!permitidas || permitidas.length === 0) {
        return Result.ok([]);
      }
      // Con varias sedes asignadas no se puede elegir por él: sin filtro vería todas
      if (permitidas.length > 1) {
        return Result.fail(new SucursalRequeridaError());
      }
      sucursalId = permitidas[0];
    }

    const ranking = await this.metricasRepository.obtenerRankingProductos({
      orden: request.orden,
      limite: request.limite ?? 10,
      sucursalId,
      desde: request.desde,
      hasta: request.hasta,
    });

    return Result.ok(ranking);
  }
}
