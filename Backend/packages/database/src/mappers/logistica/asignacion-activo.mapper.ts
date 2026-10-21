import { AsignacionActivo, EstadoAsignacion } from '@warengine/core';

export interface AsignacionJoinRow {
  id: string;
  activoId: string;
  empleadoId: string | null;
  empleadoNombre: string | null;
  areaId: number | null;
  areaNombre: string | null;
  sucursalId: number;
  asignadoPor: string;
  fechaAsignacion: Date;
  fechaDevolucionEsperada: Date | null;
  fechaDevolucionReal: Date | null;
  estado: string;
  observaciones: string | null;
}

export function asignacionActivoFromRow(row: AsignacionJoinRow): AsignacionActivo {
  return new AsignacionActivo(
    row.id,
    row.activoId,
    row.empleadoId,
    row.empleadoNombre,
    row.areaId,
    row.areaNombre,
    row.sucursalId,
    row.asignadoPor,
    row.fechaAsignacion,
    row.fechaDevolucionEsperada,
    row.fechaDevolucionReal,
    row.estado as EstadoAsignacion,
    row.observaciones,
  );
}
