import { CategoriaActivo } from '@warengine/core';
import { CategoriaActivoRecord } from '../../schema/logistica.schema.ts';

export function categoriaActivoFromRow(row: CategoriaActivoRecord): CategoriaActivo {
  return new CategoriaActivo(
    row.id_categoria_activo,
    row.nombre,
    row.is_active === 1,
  );
}
