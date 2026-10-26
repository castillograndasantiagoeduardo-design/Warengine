/**
 * branch-dashboard.interface.ts — Contrato de servicio para el Dashboard de Administración de Sucursal.
 *
 * Principio SOLID: Dependency Inversion (DIP).
 * Los componentes y hooks de la UI dependen exclusivamente de esta abstracción,
 * desacoplando la capa visual del cliente de transporte HTTP.
 */

import type { BranchDashboardData, DashboardPeriodo } from '../types/branch-dashboard.types';

export interface ObtenerDashboardParams {
  sucursalId?: number;
  periodo?: DashboardPeriodo;
}

export interface IBranchDashboardService {
  /**
   * Obtiene la agregación completa de métricas, tendencias, inventario y personal
   * para la sucursal activa.
   */
  obtenerDashboard(params?: ObtenerDashboardParams): Promise<BranchDashboardData>;
}
