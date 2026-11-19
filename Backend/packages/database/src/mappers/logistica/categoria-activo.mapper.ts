import { CategoriaActivo } from '@warengine/core';
import { CategoriaActivoRecord } from '../../schema/logistica.schema.ts';

export type CategoriaActivoRow = CategoriaActivoRecord & {
  cantidad_activos?: number | string;
};

export function categoriaActivoFromRow(row: CategoriaActivoRow): CategoriaActivo {
  return new CategoriaActivo(
    row.id_categoria_activo,
    row.nombre,
    row.is_active === 1,
    row.cantidad_activos ? Number(row.cantidad_activos) : 0,
  );
}
