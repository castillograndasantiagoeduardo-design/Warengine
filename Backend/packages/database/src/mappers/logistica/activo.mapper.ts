import { Activo, EstadoActivo } from '@warengine/core';

export interface ActivoJoinRow {
  id: string;
  codigoActivo: string;
  nombre: string;
  categoriaActivoId: number | null;
  categoriaNombre: string | null;
  sucursalId: number;
  estado: string;
  valorAdquisicion: string | null;
  fechaAdquisicion: string | null;
  condicion: string | null;
  isActive: number;
}

export function activoFromRow(row: ActivoJoinRow): Activo {
  return new Activo(
    row.id,
    row.codigoActivo,
    row.nombre,
    row.categoriaActivoId,
    row.categoriaNombre,
    row.sucursalId,
    row.estado as EstadoActivo,
    row.valorAdquisicion !== null ? Number(row.valorAdquisicion) : null,
    row.fechaAdquisicion,
    row.condicion,
    row.isActive === 1,
  );
}
