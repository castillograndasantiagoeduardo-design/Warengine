/**
 * empleado.mapper.ts
 *
 * Mapeador que transforma filas relacionales resultantes de joins sobre `empleados`, `sucursales`
 * y `areas` a instancias de la entidad de dominio `Empleado`.
 *
 * Rol en la arquitectura:
 * - Capa de Persistencia / Mappers.
 * - Convierte tipos relacionales (TINYINT, DECIMAL string de Drizzle) a tipos del dominio (boolean, number).
 *
 * Requisito SRS:
 * - RF-ADM-C12: Ficha y datos de empleados.
 * - RF-ADM-C5: Consulta de personal con contexto de sede y área.
 */

import { Empleado } from '@warengine/core';

export interface EmpleadoRow {
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
  sueldoActual: string | number | null;
  isActive: number;
}

export function empleadoFromRow(row: EmpleadoRow): Empleado {
  return new Empleado(
    row.id,
    row.tipoDocumento,
    row.numeroDocumento,
    row.nombre,
    row.telefono,
    row.direccion,
    row.cargo,
    row.areaId,
    row.areaNombre,
    row.sucursalId,
    row.sucursalNombre,
    row.fechaIngreso,
    row.sueldoActual !== null && row.sueldoActual !== undefined
      ? Number(row.sueldoActual)
      : null,
    row.isActive === 1,
  );
}
