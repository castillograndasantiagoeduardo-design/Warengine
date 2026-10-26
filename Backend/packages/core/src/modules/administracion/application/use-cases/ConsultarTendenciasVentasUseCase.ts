import { DomainError, Result } from '@warengine/shared-kernel';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import {
  SucursalFueraDeAlcanceError,
  SucursalRequeridaError,
} from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { RangoFechasInvalidoError } from '../../domain/errors/AdministracionErrors.ts';
import type {
  IMetricasAdminRepository,
  PuntoTendenciaVenta,
} from '../../domain/repositories/IMetricasAdminRepository.ts';

export interface ConsultarTendenciasVentasRequest {
  usuarioId: string;
  agrupacion: 'dia' | 'semana' | 'mes';
  sucursalId?: number;
  desde?: Date;
  hasta?: Date;
}

export type ConsultarTendenciasVentasResponse = Result<PuntoTendenciaVenta[], DomainError>;

/**
 * RF-ADM-A2: Gráfico de tendencias de ventas con visualización diaria, semanal o mensual.
 * RNF-ADM-04: Alcance por sucursal.
 */
export class ConsultarTendenciasVentasUseCase {
  constructor(
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly metricasRepository: IMetricasAdminRepository,
  ) {}

  public async execute(request: ConsultarTendenciasVentasRequest): Promise<ConsultarTendenciasVentasResponse> {
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

    const puntos = await this.metricasRepository.obtenerTendenciasVentas({
      agrupacion: request.agrupacion,
      sucursalId,
      desde: request.desde,
      hasta: request.hasta,
    });

    return Result.ok(puntos);
  }
}
