/**
 * branch-assets.types.ts — Tipos de dominio para el módulo de Activos del Administrador de Sucursal.
 *
 * Principio SOLID: Interface Segregation Principle (ISP).
 * Modela exclusivamente las entidades de activos fijos, mantenimientos y categorías
 * de la sede correspondientes a rolId: 2 (RF-LOG-A1..A5, RF-LOG-B1..B5, RF-LOG-C1..C3).
 */

export type EstadoActivo = 'disponible' | 'asignado' | 'mantenimiento' | 'baja';

export type TipoMantenimiento = 'preventivo' | 'correctivo';

export interface CustodioActivo {
  id: string;
  nombre: string;
  tipo: 'empleado' | 'area';
  fechaAsignacion: string;
  fechaDevolucionEsperada?: string | null;
  observaciones?: string | null;
}

export interface MantenimientoHistorialItem {
  id: string;
  tipo: TipoMantenimiento;
  fecha: string;
  fechaFin: string | null;
  costo: number | null;
  proveedorNombre: string | null;
  descripcion: string | null;
}

export interface ActivoSede {
  id: string;
  codigoActivo: string;
  nombre: string;
  categoriaActivoId: number | null;
  categoriaNombre: string | null;
  sucursalId: number;
  estado: EstadoActivo;
  valorAdquisicion: number | null;
  fechaAdquisicion: string | null;
  condicion: string | null;
  isActive: boolean;
  custodioActual?: CustodioActivo | null;
  historialMantenimientos?: MantenimientoHistorialItem[];
}

export interface ActivosFiltros {
  busqueda?: string;
  categoriaActivoId?: number;
  estado?: EstadoActivo;
  areaId?: number;
  page?: number;
  limit?: number;
}

export interface ActivosResumen {
  total: number;
  disponibles: number;
  asignados: number;
  enMantenimiento: number;
  deBaja: number;
  valorTotal: number;
}

export interface ActivosResultadoPaginado {
  items: ActivoSede[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  resumen?: ActivosResumen;
}

export interface CrearActivoDTO {
  codigoActivo: string;
  nombre: string;
  categoriaActivoId?: number | null;
  sucursalId: number;
  valorAdquisicion?: number | null;
  fechaAdquisicion?: string | null;
  condicion?: string | null;
}

export interface EditarActivoDTO {
  nombre?: string;
  categoriaActivoId?: number | null;
  valorAdquisicion?: number | null;
  fechaAdquisicion?: string | null;
  condicion?: string | null;
}

export interface DarBajaActivoDTO {
  motivo: string;
}

export interface AsignarActivoEmpleadoDTO {
  empleadoId: string;
  fechaDevolucionEsperada?: string | null;
  observaciones?: string | null;
}

export interface AsignarActivoAreaDTO {
  areaId: number;
  fechaDevolucionEsperada?: string | null;
  observaciones?: string | null;
}

export interface DevolverActivoDTO {
  observaciones?: string | null;
}

// ─── Mantenimientos ─────────────────────────────────────────────────────────

export interface MantenimientoSede {
  id: string;
  activoId: string;
  activoCodigo: string;
  activoNombre: string;
  sucursalId: number;
  proveedorId: number | null;
  proveedorNombre: string | null;
  tipo: TipoMantenimiento;
  fecha: string;
  fechaFin: string | null;
  costo: number | null;
  descripcion: string | null;
  enCurso: boolean;
}

export interface MantenimientosFiltros {
  sucursalId?: number;
  activoId?: string;
  tipo?: TipoMantenimiento;
  estado?: 'todos' | 'en_curso' | 'finalizado';
  desde?: string;
  hasta?: string;
  page?: number;
  limit?: number;
}

export interface MantenimientosResumen {
  total: number;
  enCurso: number;
  finalizados: number;
  vencidos: number;
}

export interface MantenimientosResultadoPaginado {
  items: MantenimientoSede[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  resumen?: MantenimientosResumen;
}

export interface RegistrarMantenimientoDTO {
  proveedorId?: number | null;
  tipo: TipoMantenimiento;
  fecha?: string | null;
  costo?: number | null;
  descripcion?: string | null;
}

export interface FinalizarMantenimientoDTO {
  fechaFin: string;
  costo?: number | null;
  descripcion?: string | null;
}

// ─── Categorías de Activos ──────────────────────────────────────────────────

export interface CategoriaActivoSede {
  id: number;
  nombre: string;
  isActive: boolean;
  cantidadActivos: number;
}

export interface CategoriasActivosFiltros {
  busqueda?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CategoriasActivosResultadoPaginado {
  items: CategoriaActivoSede[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CrearCategoriaActivoDTO {
  nombre: string;
}

export interface EditarCategoriaActivoDTO {
  nombre: string;
}
