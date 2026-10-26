/**
 * administracion.types.ts — Tipos del módulo de Administración en Frontend.
 *
 * Los inputs (payloads y filtros) se re-exportan desde @warengine/contracts.
 * Las respuestas de la API no tienen esquema Zod en contracts (salvo el detalle de
 * sucursal), así que se tipan aquí reflejando las entidades del backend:
 * Backend/packages/core/src/modules/administracion/domain/**.
 */

import type {
  CrearSucursalInput,
  EditarSucursalInput,
  CambiarEstadoSucursalInput,
  DetalleSucursalResponse,
  CrearAreaInput,
  EditarAreaInput,
  EditarEmpleadoInput,
  RegistrarAumentoSalarioInput,
} from '@warengine/contracts';

export type {
  CrearSucursalInput,
  EditarSucursalInput,
  CambiarEstadoSucursalInput,
  CrearAreaInput,
  EditarAreaInput,
  EditarEmpleadoInput,
  RegistrarAumentoSalarioInput,
};

// ─── Sucursales ────────────────────────────────────────────────
export interface Sucursal {
  id: number;
  nombre: string;
  direccion: string | null;
  contacto: string | null;
  isActive: boolean;
}

export type SucursalDetalle = DetalleSucursalResponse;

/** La Sede Principal (id 1) es inmutable: no puede inactivarse. */
export const SEDE_PRINCIPAL_ID = 1;

// ─── Dashboard ─────────────────────────────────────────────────
export interface MetricasGanancias {
  ingresosTotales: number;
  costoTotal: number;
  gananciaNeta: number;
  margenPorcentaje: number;
  totalFacturas: number;
  ticketPromedio: number;
}

export type AgrupacionTendencia = 'dia' | 'semana' | 'mes';

export interface PuntoTendenciaVenta {
  periodo: string;
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

export type OrdenRanking = 'mas_vendidos' | 'menos_vendidos';

export interface ItemRankingProducto {
  productoId: string;
  sku: string;
  nombre: string;
  cantidadVendida: number;
  totalRecaudado: number;
  gananciaGenerada: number;
}

/** Filtros comunes del dashboard. Las fechas viajan como ISO 8601. */
export interface FiltrosDashboard {
  sucursalId?: number;
  desde?: string;
  hasta?: string;
}

// ─── Áreas, empleados y salarios ───────────────────────────────
export interface Area {
  id: number;
  nombre: string;
  sucursalId: number;
}

export interface Empleado {
  id: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  cargo: string | null;
  areaId: number | null;
  areaNombre: string | null;
  sucursalId: number;
  sucursalNombre: string;
  fechaIngreso: string;
  sueldoActual: number | null;
  isActive: boolean;
}

export interface FiltrosEmpleados {
  sucursalId?: number;
  areaId?: number;
  isActive?: boolean;
}

export interface HistorialSalario {
  id: string;
  empleadoId: string;
  sueldo: number;
  fechaEfectiva: string;
  motivo: string | null;
  registradoPor: string;
  createdAt: string;
  registradorNombre?: string | null;
}

// ─── Usuarios (solo lectura por ahora, para KPIs) ──────────────
export interface UsuarioGestionado {
  id: string;
  nombre: string;
  email: string;
  rolId: number;
  rolNombre: string;
  sucursalId: number;
  sucursalNombre: string;
  isActive: boolean;
  /** Sedes autorizadas además de la principal (RF-ADM-C10). */
  sucursalesAdicionales: { id: number; nombre: string }[];
}

// ─── Auditoría ─────────────────────────────────────────────────
/** Registro de logs_auditoria. `detalles` viene sanitizado ({ antes, despues } en mutaciones). */
export interface LogAuditoria {
  id: string;
  usuarioId: string | null;
  usuarioNombre: string | null;
  accion: string;
  entidad: string;
  entidadId: string | null;
  detalles: Record<string, unknown> | null;
  ip: string | null;
  fecha: string;
}

/** Filtros de consultarAuditoriaSchema (fechas YYYY-MM-DD: el backend cubre el día completo). */
export interface FiltrosAuditoria {
  usuarioId?: string;
  accion?: string;
  entidad?: string;
  desde?: string;
  hasta?: string;
}

/** GET /administracion/usuarios/:id/sucursales */
export interface SucursalesDeUsuario {
  usuarioId: string;
  principal: { id: number; nombre: string };
  adicionales: { id: number; nombre: string }[];
  autorizadas: { id: number; nombre: string }[];
}
