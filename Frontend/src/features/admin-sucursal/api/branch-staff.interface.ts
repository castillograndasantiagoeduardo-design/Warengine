/**
 * branch-staff.interface.ts — Contrato de servicio para colaboradores y turnos POS.
 * 
 * Principio SOLID: Dependency Inversion Principle (DIP).
 */

import type {
  EmpleadoSede,
  EditarEmpleadoDTO,
  TurnoCajaActivo,
  AbrirTurnoDTO,
  CerrarTurnoDTO,
} from '../types/branch-staff.types';

export interface IBranchStaffService {
  listarEmpleados(
    sucursalId: number,
    filtros?: { isActive?: boolean; areaId?: number },
  ): Promise<EmpleadoSede[]>;

  obtenerEmpleado(id: string): Promise<EmpleadoSede>;

  editarEmpleado(id: string, data: EditarEmpleadoDTO): Promise<EmpleadoSede>;

  obtenerTurnoActual(): Promise<TurnoCajaActivo | null>;

  abrirTurno(dto: AbrirTurnoDTO): Promise<TurnoCajaActivo>;

  cerrarTurno(turnoId: string, dto: CerrarTurnoDTO): Promise<any>;
}
