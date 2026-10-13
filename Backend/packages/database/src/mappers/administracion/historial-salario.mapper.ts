/**
 * historial-salario.mapper.ts
 *
 * Mapeador que transforma filas relacionales de `historial_salarios` a la entidad `HistorialSalario`.
 *
 * Requisito SRS:
 * - RF-ADM-C14: Historial de salarios de empleados.
 */

import { HistorialSalario } from '@warengine/core';

export interface HistorialSalarioRow {
  id: string;
  empleadoId: string;
  sueldo: string | number;
  fechaEfectiva: string;
  motivo: string | null;
  registradoPor: string;
  createdAt: Date;
  registradorNombre?: string | null;
}

export function historialSalarioFromRow(row: HistorialSalarioRow): HistorialSalario {
  return new HistorialSalario(
    row.id,
    row.empleadoId,
    Number(row.sueldo),
    row.fechaEfectiva,
    row.motivo,
    row.registradoPor,
    row.createdAt,
    row.registradorNombre ?? null,
  );
}
