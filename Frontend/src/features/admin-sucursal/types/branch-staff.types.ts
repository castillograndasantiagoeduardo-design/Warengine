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
  sucursalId: number;
  fondoInicial: number;
  fondoFinal?: number | null;
  diferencia?: number | null;
  fechaApertura: string | Date;
  fechaCierre?: string | Date | null;
  totalVentas?: number;
  cantidadVentas?: number;
  estado: 'abierto' | 'cerrado';
}

export interface AbrirTurnoDTO {
  fondoInicial: number;
}

export interface CerrarTurnoDTO {
  fondoFinal: number;
}
