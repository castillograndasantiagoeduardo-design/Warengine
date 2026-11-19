/**
 * branch-staff.types.ts — Tipos de dominio para gestión de colaboradores y turnos de caja en sede.
 * 
 * Principio SOLID: Interface Segregation Principle (ISP).
 * Modela exclusivamente las entidades de colaboradores y turnos POS requeridos por el rol
 * Admin de Sucursal (RF-ADM-C5, RF-ADM-C12, RF-FMC-B2, RF-FMC-A10).
 */

export interface EmpleadoSede {
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

export interface EmpleadosFiltros {
  q?: string;
  cargo?: string;
  isActive?: boolean;
  page?: number;
  limite?: number;
}

export interface EmpleadosResultadoPaginado {
  items: EmpleadoSede[];
  total: number;
  totalPaginas: number;
  page: number;
  limite: number;
}

export interface EditarEmpleadoDTO {
  nombre?: string;
  telefono?: string | null;
  direccion?: string | null;
  cargo?: string | null;
  areaId?: number | null;
  isActive?: boolean;
}

export interface TurnoCajaActivo {
  id: string;
  usuarioId: string;
  usuarioNombre?: string;
  cajeroNombre?: string | null;
  cajeroEmail?: string;
  sucursalId: number;
  fondoInicial: number;
  fondoFinal?: number | null;
  diferencia?: number | null;
  fechaApertura: string | Date;
  fechaCierre?: string | Date | null;
  totalVentas: number;
  cantidadVentas: number;
  efectivoEsperado?: number;
  estado: 'abierto' | 'cerrado';
}

export interface AbrirTurnoDTO {
  fondoInicial: number;
}

export interface CerrarTurnoDTO {
  fondoFinal: number;
}

export interface CierreAdministrativoInput {
  motivo: string;
  fondoFinal?: number;
}

export interface HistorialTurnosFiltros {
  desde?: string;
  hasta?: string;
  usuarioId?: string;
  tipoCierre?: 'normal' | 'administrativo';
  conDiferencia?: boolean;
  page?: number;
  limite?: number;
}

export interface TurnoHistorialItem {
  id: string;
  usuarioId: string;
  cajeroNombre: string | null;
  cajeroEmail: string;
  sucursalId: number;
  sucursalNombre?: string | null;
  cajaNombre?: string | null;
  fondoInicial: number;
  fondoFinal: number | null;
  diferencia: number | null;
  fechaApertura: string;
  fechaCierre: string;
  tipoCierre: 'normal' | 'administrativo';
  cerradoPor: string | null;
  cerradoPorNombre?: string | null;
  motivoCierre?: string | null;
  totalVendido: number;
  cantidadVentas: number;
  efectivoEsperado: number;
}

export interface HistorialTurnosResultado {
  items: TurnoHistorialItem[];
  total: number;
  totalPaginas: number;
  page: number;
  limite: number;
}

export interface TurnoCorteDetalle {
  id: string;
  usuarioId: string;
  cajeroNombre: string | null;
  cajeroEmail: string;
  sucursalId: number;
  sucursalNombre: string;
  cajaNombre?: string | null;
  fondoInicial: number;
  fondoFinal: number | null;
  diferencia: number | null;
  fechaApertura: string;
  fechaCierre: string | null;
  tipoCierre: 'normal' | 'administrativo';
  cerradoPor: string | null;
  cerradoPorNombre?: string | null;
  motivoCierre?: string | null;
  cantidadVentas: number;
  totalVentas: number;
  ventasPorMetodo: {
    efectivo: number;
    tarjeta: number;
    transferencia: number;
    credito_corporativo: number;
  };
  efectivoEsperado: number;
}
