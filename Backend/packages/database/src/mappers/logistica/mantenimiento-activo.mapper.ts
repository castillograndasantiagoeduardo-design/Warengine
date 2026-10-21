import { MantenimientoActivo, TipoMantenimiento } from '@warengine/core';

export interface MantenimientoJoinRow {
  id: string;
  activoId: string;
  proveedorId: number | null;
  proveedorNombre: string | null;
  tipo: string;
  fecha: string;
  fechaFin: string | null;
  costo: string | null;
  descripcion: string | null;
}

export function mantenimientoActivoFromRow(row: MantenimientoJoinRow): MantenimientoActivo {
  return new MantenimientoActivo(
    row.id,
    row.activoId,
    row.proveedorId,
    row.proveedorNombre,
    row.tipo as TipoMantenimiento,
    row.fecha,
    row.fechaFin,
    row.costo !== null ? Number(row.costo) : null,
    row.descripcion,
  );
}
