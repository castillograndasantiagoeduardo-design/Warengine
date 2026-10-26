/**
 * ConsultarResumenDashboardUseCase.ts
 *
 * Resumen global de la plataforma para el dashboard del Super Admin (RF-ADM-A1, RF-SA-I3):
 * sucursales operativas, usuarios activos y ventas consolidadas de todas las sedes.
 *
 * Es una vista exclusivamente global (permiso administracion:ver-metricas-globales),
 * por eso no resuelve alcance por sucursal. Consulta de solo lectura: no audita.
 */
import { DomainError, Result } from '@warengine/shared-kernel';
import { RangoFechasInvalidoError } from '../../domain/errors/AdministracionErrors.ts';
import type { IMetricasAdminRepository } from '../../domain/repositories/IMetricasAdminRepository.ts';
import type { IResumenOrganizacionRepository } from '../../domain/repositories/IResumenOrganizacionRepository.ts';

export interface ConsultarResumenDashboardRequest {
  desde?: Date;
  hasta?: Date;
}

export interface ResumenDashboard {
  totalSucursales: number;
  sucursalesActivas: number;
  usuariosTotales: number;
  usuariosActivos: number;
  ventasConsolidadas: number;
  gananciaNeta: number;
  totalFacturas: number;
  ticketPromedio: number;
}

export type ConsultarResumenDashboardResponse = Result<ResumenDashboard, DomainError>;

export class ConsultarResumenDashboardUseCase {
  constructor(
    private readonly resumenRepository: IResumenOrganizacionRepository,
    private readonly metricasRepository: IMetricasAdminRepository,
  ) {}

  public async execute(
    request: ConsultarResumenDashboardRequest = {},
  ): Promise<ConsultarResumenDashboardResponse> {
    if (request.desde && request.hasta && request.desde > request.hasta) {
      return Result.fail(new RangoFechasInvalidoError());
    }

    const [organizacion, ventas] = await Promise.all([
      this.resumenRepository.obtenerResumenOrganizacion(),
      this.metricasRepository.obtenerMetricasGanancias({ desde: request.desde, hasta: request.hasta }),
    ]);

    return Result.ok({
      ...organizacion,
      ventasConsolidadas: ventas.ingresosTotales,
      gananciaNeta: ventas.gananciaNeta,
      totalFacturas: ventas.totalFacturas,
      ticketPromedio: ventas.ticketPromedio,
    });
  }
}
