/**
 * dashboard.service.ts — Analítica del dashboard administrativo (RF-ADM-A1 a A6).
 *
 * Endpoints reales: /administracion/dashboard/{metricas,tendencias,rendimiento,ranking}
 * y /administracion/alertas-stock. El backend aplica el alcance por sucursal
 * (RNF-ADM-04): el Super Admin ve global; el admin de sucursal, solo su sede.
 */

import { IHttpClient, apiClient } from '@/lib/api';
import type { Paginado } from '@/lib/types/paginacion';
import type {
  AgrupacionTendencia,
  FiltrosDashboard,
  ItemRankingProducto,
  MetricasGanancias,
  OrdenRanking,
  PuntoTendenciaVenta,
  RendimientoSucursal,
} from '../types';

export interface IDashboardService {
  obtenerMetricas(filtros: FiltrosDashboard): Promise<MetricasGanancias>;
  obtenerTendencias(filtros: FiltrosDashboard & { agrupacion: AgrupacionTendencia }): Promise<PuntoTendenciaVenta[]>;
  obtenerRendimiento(filtros: Omit<FiltrosDashboard, 'sucursalId'> & { sucursalIds?: number[] }): Promise<RendimientoSucursal[]>;
  obtenerRanking(filtros: FiltrosDashboard & { orden: OrdenRanking; limite?: number }): Promise<ItemRankingProducto[]>;
  contarAlertasStock(sucursalId?: number): Promise<number>;
}

const BASE = '/administracion/dashboard';

export class DashboardService implements IDashboardService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  public obtenerMetricas(filtros: FiltrosDashboard): Promise<MetricasGanancias> {
    return this.http.get<MetricasGanancias>(`${BASE}/metricas`, { params: { ...filtros } });
  }

  public obtenerTendencias(filtros: FiltrosDashboard & { agrupacion: AgrupacionTendencia }): Promise<PuntoTendenciaVenta[]> {
    return this.http.get<PuntoTendenciaVenta[]>(`${BASE}/tendencias`, { params: { ...filtros } });
  }

  public obtenerRendimiento({
    sucursalIds,
    ...filtros
  }: Omit<FiltrosDashboard, 'sucursalId'> & { sucursalIds?: number[] }): Promise<RendimientoSucursal[]> {
    return this.http.get<RendimientoSucursal[]>(`${BASE}/rendimiento`, {
      // El esquema acepta la lista separada por comas: ?sucursalIds=1,2,3
      params: { ...filtros, sucursalIds: sucursalIds?.length ? sucursalIds.join(',') : undefined },
    });
  }

  public obtenerRanking(filtros: FiltrosDashboard & { orden: OrdenRanking; limite?: number }): Promise<ItemRankingProducto[]> {
    return this.http.get<ItemRankingProducto[]>(`${BASE}/ranking`, { params: { ...filtros } });
  }

  public async contarAlertasStock(sucursalId?: number): Promise<number> {
    const res = await this.http.get<Paginado<unknown>>('/administracion/alertas-stock', {
      params: { sucursalId, page: 1, limit: 1 },
    });
    return res.total;
  }
}

export const dashboardService = new DashboardService();
