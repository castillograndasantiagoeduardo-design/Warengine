import { apiFetch } from '@/lib/api-client';

export interface MetricasGananciasResponse {
  ingresosTotales: number;
  costoTotal: number;
  gananciaNeta: number;
  margenPorcentaje: number;
  totalFacturas: number;
  ticketPromedio: number;
}

export interface TendenciaVentaItem {
  periodo: string;
  totalVentas: number;
  totalGanancias?: number;
  cantidadFacturas: number;
}

export interface RendimientoSucursalItem {
  sucursalId: number;
  nombreSucursal: string;
  totalVentas: number;
  totalFacturas: number;
  ticketPromedio: number;
  gananciaNeta: number;
}

export interface RankingProductoItem {
  productoId: string | number;
  sku: string;
  nombre: string;
  cantidadVendida: number;
  totalRecaudado: number;
  gananciaGenerada?: number;
}

export interface ExistenciaPorSucursal {
  sucursalId: number;
  nombreSucursal: string;
  stockActual: number;
  stockMinimo: number;
  estadoStock: string;
}

export interface ComparativoInventarioItem {
  productoId: string;
  sku: string;
  nombre: string;
  categoriaNombre: string;
  stockTotal: number;
  existenciasPorSucursal: ExistenciaPorSucursal[];
}

export async function fetchMetricasGanancias(params?: {
  sucursalId?: number;
  fechaInicio?: string;
  fechaFin?: string;
}) {
  return apiFetch<MetricasGananciasResponse>('/administracion/dashboard/metricas', { params });
}

export async function fetchTendenciasVentas(params?: {
  sucursalId?: number;
  fechaInicio?: string;
  fechaFin?: string;
  agrupacion?: 'dia' | 'semana' | 'mes';
}) {
  return apiFetch<TendenciaVentaItem[]>('/administracion/dashboard/tendencias', { params });
}

export async function fetchRendimientoSucursales(params?: {
  fechaInicio?: string;
  fechaFin?: string;
}) {
  return apiFetch<RendimientoSucursalItem[]>('/administracion/dashboard/rendimiento', { params });
}

export async function fetchRankingProductos(params?: {
  sucursalId?: number;
  fechaInicio?: string;
  fechaFin?: string;
  limite?: number;
  orden?: 'mas_vendidos' | 'menos_vendidos';
}) {
  return apiFetch<RankingProductoItem[]>('/administracion/dashboard/ranking', { params });
}

export async function fetchComparativoInventario(params?: { productoId?: number }) {
  return apiFetch<ComparativoInventarioItem[]>('/administracion/dashboard/inventario', { params });
}
