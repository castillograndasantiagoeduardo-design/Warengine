/**
 * branch-dashboard.types.ts — Modelos de dominio y vista para el Dashboard de Admin de Sucursal.
 *
 * Principio SOLID: Interface Segregation (ISP).
 * Define estructuras de datos granulares, cohesivas y fuertemente tipadas para cada
 * bloque del panel administrativo (KPIs, gráfica horaria, salud de stock, turnos y facturas).
 */

export type DashboardPeriodo = 'hoy' | '7d' | '30d';

export interface KpiVentas {
  valor: number;
  valorFormateado: string;
  /** Variación real frente a ayer (solo periodo 'hoy'); null si no hay base de comparación. */
  porcentajeCambio: number | null;
  tendencia: 'sube' | 'baja';
  comparativaTexto: string;
}

export interface KpiTransacciones {
  total: number;
  porcentajeCambio: number | null;
  ticketPromedio: number;
  ticketPromedioFormateado: string;
}

export interface KpiCatalogoStock {
  totalProductos: number;
  totalAlertas: number;
  stockBajo: number;
  agotados: number;
}

export interface KpiCajerosActivos {
  activos: number;
  total: number;
  turnosAbiertos: number;
  disponibles: number;
}

export interface KpisSucursal {
  ventas: KpiVentas;
  transacciones: KpiTransacciones;
  stock: KpiCatalogoStock;
  cajeros: KpiCajerosActivos;
}

export interface SalesVelocityPoint {
  hora: string;
  ventasHoy: number;
}

export interface SalesVelocityData {
  puntos: SalesVelocityPoint[];
  totalHoy: number;
  /** Total facturado ayer según /dashboard/tendencias; null si no se pudo consultar. */
  totalAyer: number | null;
}

export interface AlertaStockItem {
  id: string;
  sku: string;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  unidadMedida?: string;
  estado: 'critico' | 'bajo';
}

export interface InventoryHealthData {
  porcentajeSaludable: number;
  productosSaludables: number;
  totalProductos: number;
  stockBajoCount: number;
  sinExistenciasCount: number;
  alertasPrioritarias: AlertaStockItem[];
}

export interface RecentInvoiceItem {
  id: string;
  numero: string;
  hora: string;
  clienteNombre: string;
  cajeroNombre: string;
  total: number;
  totalFormateado: string;
  estado: 'completada' | 'anulada' | 'pendiente';
}

export interface CashierShiftItem {
  id: string;
  cajeroNombre: string;
  cajeroIniciales: string;
  cajaNumero: string;
  horaInicio: string;
  totalVentas: number;
  totalVentasFormateado: string;
  cantidadVentas: number;
  estado: 'abierto' | 'cerrado';
}

export interface BranchDashboardData {
  sucursalId: number;
  sucursalNombre: string;
  fechaOperacion: string;
  ultimaSincronizacion: string;
  kpis: KpisSucursal;
  velocidadVentas: SalesVelocityData;
  saludInventario: InventoryHealthData;
  operacionesRecientes: RecentInvoiceItem[];
  cajerosEnTurno: CashierShiftItem[];
}
