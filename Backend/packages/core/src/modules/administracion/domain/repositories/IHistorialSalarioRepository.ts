/**
 * IHistorialSalarioRepository.ts
 *
 * Puerto de persistencia para el historial salarial de empleados.
 *
 * Rol en la arquitectura:
 * - Puerto del dominio (Ports & Adapters).
 * - Define los contratos de acceso a datos para registrar y consultar ajustes salariales.
 *
 * Requisito SRS:
 * - RF-ADM-C14: Historial de salarios de empleados.
 */

import { HistorialSalario } from '../entities/HistorialSalario.ts';

export interface RegistrarSalarioData {
  empleadoId: string;
  sueldo: number;
  fechaEfectiva?: string;
  motivo?: string | null;
  registradoPor: string;
}

export interface IHistorialSalarioRepository {
  listarPorEmpleado(empleadoId: string): Promise<HistorialSalario[]>;
  obtenerUltimoSalario(empleadoId: string): Promise<HistorialSalario | null>;
  registrar(data: RegistrarSalarioData): Promise<HistorialSalario>;
}
