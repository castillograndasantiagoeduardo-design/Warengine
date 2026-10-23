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
  cantidadFacturas: number;
}

export interface RendimientoSucursalItem {
  sucursalId: number;
  nombreSucursal: string;
  totalIngresos: number;
  totalCostos: number;
  gananciaBruta: number;
  cantidadVentas: number;
  margenPorcentaje: number;
}

export interface RankingProductoItem {
  productoId: number;
  codigoSku: string;
  nombreProducto: string;
  unidadesVendidas: number;
  ingresosGenerados: number;
}

export interface ComparativoInventarioItem {
  productoId: number;
  sku: string;
  nombre: string;
  sucursalId: number;
  nombreSucursal: string;
  stockActual: number;
  stockMinimo: number;
  estadoStock: 'agotado' | 'critico' | 'optimo';
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
  orden?: 'asc' | 'desc';
}) {
  return apiFetch<RankingProductoItem[]>('/administracion/dashboard/ranking', { params });
}

export async function fetchComparativoInventario(params?: { productoId?: number }) {
  return apiFetch<ComparativoInventarioItem[]>('/administracion/dashboard/inventario', { params });
}
