/**
 * branch-staff.interface.ts — Contrato de servicio para colaboradores y turnos POS.
 * 
 * Principio SOLID: Dependency Inversion Principle (DIP).
 */

import type {
  EmpleadoSede,
  EmpleadosFiltros,
  EmpleadosResultadoPaginado,
  EditarEmpleadoDTO,
  TurnoCajaActivo,
  AbrirTurnoDTO,
  CerrarTurnoDTO,
  CierreAdministrativoInput,
  HistorialTurnosFiltros,
  HistorialTurnosResultado,
  TurnoCorteDetalle,
} from '../types/branch-staff.types';

export interface IBranchStaffService {
  listarEmpleados(
    sucursalId: number,
    filtros?: { isActive?: boolean; areaId?: number },
  ): Promise<EmpleadoSede[]>;

  listarEmpleadosPaginado(
    sucursalId: number,
    filtros?: EmpleadosFiltros,
  ): Promise<EmpleadosResultadoPaginado>;

  obtenerEmpleado(id: string): Promise<EmpleadoSede>;

  editarEmpleado(id: string, data: EditarEmpleadoDTO): Promise<EmpleadoSede>;

  obtenerTurnoActual(): Promise<TurnoCajaActivo | null>;

  listarTurnosActivos(sucursalId?: number): Promise<TurnoCajaActivo[]>;

  abrirTurno(dto: AbrirTurnoDTO): Promise<TurnoCajaActivo>;

  cerrarTurno(turnoId: string, dto: CerrarTurnoDTO): Promise<any>;

  cerrarTurnoAdministrativo(
    turnoId: string,
    data: CierreAdministrativoInput,
  ): Promise<any>;

  listarHistorialTurnos(
    sucursalId: number,
    filtros?: HistorialTurnosFiltros,
  ): Promise<HistorialTurnosResultado>;

  obtenerCorteTurno(turnoId: string): Promise<TurnoCorteDetalle>;
}
