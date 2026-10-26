import { DomainError, Result } from '@warengine/shared-kernel';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import {
  SucursalFueraDeAlcanceError,
  SucursalRequeridaError,
} from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { RangoFechasInvalidoError } from '../../domain/errors/AdministracionErrors.ts';
import type {
  IMetricasAdminRepository,
  MetricasGanancias,
} from '../../domain/repositories/IMetricasAdminRepository.ts';

export interface ConsultarMetricasGananciasRequest {
  usuarioId: string;
  sucursalId?: number;
  desde?: Date;
  hasta?: Date;
}

export type ConsultarMetricasGananciasResponse = Result<MetricasGanancias, DomainError>;

/**
 * RF-ADM-A1: Panel de métricas globales de ganancias consolidadas.
 * RNF-ADM-04: Super Admin visibilidad transversal; Admin de Sucursal solo su sede.
 */
export class ConsultarMetricasGananciasUseCase {
  constructor(
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly metricasRepository: IMetricasAdminRepository,
  ) {}

  public async execute(request: ConsultarMetricasGananciasRequest): Promise<ConsultarMetricasGananciasResponse> {
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
        return Result.ok({
          ingresosTotales: 0,
          costoTotal: 0,
          gananciaNeta: 0,
          margenPorcentaje: 0,
          totalFacturas: 0,
          ticketPromedio: 0,
        });
      }

      // Con varias sedes asignadas no se puede elegir por él: sin filtro vería todas
      if (permitidas.length > 1) {
        return Result.fail(new SucursalRequeridaError());
      }
      sucursalId = permitidas[0];
    }

    const metricas = await this.metricasRepository.obtenerMetricasGanancias({
      sucursalId,
      desde: request.desde,
      hasta: request.hasta,
    });

    return Result.ok(metricas);
  }
}
