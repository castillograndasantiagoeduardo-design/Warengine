export interface MetricasGanancias {
  ingresosTotales: number;
  costoTotal: number;
  gananciaNeta: number;
  margenPorcentaje: number;
  totalFacturas: number;
  ticketPromedio: number;
}

export interface PuntoTendenciaVenta {
  periodo: string; // ej: "2026-10-13", "2026-W41", "2026-10"
  totalVentas: number;
  totalGanancias: number;
  cantidadFacturas: number;
}

export interface RendimientoSucursal {
  sucursalId: number;
  nombreSucursal: string;
  totalVentas: number;
  totalFacturas: number;
  ticketPromedio: number;
  gananciaNeta: number;
}

export interface ItemRankingProducto {
  productoId: string;
  sku: string;
  nombre: string;
  cantidadVendida: number;
  totalRecaudado: number;
  gananciaGenerada: number;
}

export interface ExistenciaSucursalItem {
  sucursalId: number;
  nombreSucursal: string;
  stockActual: number;
  stockMinimo: number;
  estadoStock: 'critico' | 'bajo' | 'optimo';
}

export interface ItemComparativoInventario {
  productoId: string;
  sku: string;
  nombre: string;
  categoriaNombre?: string;
  existenciasPorSucursal: ExistenciaSucursalItem[];
  stockTotal: number;
}

export interface FiltroMetricasGanancias {
  sucursalId?: number;
  desde?: Date;
  hasta?: Date;
}

export interface FiltroTendenciasVentas {
  sucursalId?: number;
  agrupacion: 'dia' | 'semana' | 'mes';
  desde?: Date;
  hasta?: Date;
}

export interface FiltroRendimientoSucursales {
  sucursalIds?: number[];
  desde?: Date;
  hasta?: Date;
}

export interface FiltroRankingProductos {
  sucursalId?: number;
  orden: 'mas_vendidos' | 'menos_vendidos';
  limite?: number;
  desde?: Date;
  hasta?: Date;
}

export interface FiltroComparativoInventario {
  productoId?: string;
  categoriaId?: number;
  sucursalIds?: number[];
  soloConStockBajo?: boolean;
}

export interface IMetricasAdminRepository {
  obtenerMetricasGanancias(filtro: FiltroMetricasGanancias): Promise<MetricasGanancias>;
  obtenerTendenciasVentas(filtro: FiltroTendenciasVentas): Promise<PuntoTendenciaVenta[]>;
  obtenerRendimientoSucursales(filtro: FiltroRendimientoSucursales): Promise<RendimientoSucursal[]>;
  obtenerRankingProductos(filtro: FiltroRankingProductos): Promise<ItemRankingProducto[]>;
  obtenerComparativoInventario(filtro: FiltroComparativoInventario): Promise<ItemComparativoInventario[]>;
}
