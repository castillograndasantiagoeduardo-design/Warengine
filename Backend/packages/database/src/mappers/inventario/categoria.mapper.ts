import { Categoria } from '@warengine/core';
import { CategoriaRecord } from '../../schema/inventario.schema.ts';

export interface CategoriaRowExtendida extends CategoriaRecord {
  total_productos?: number | string | null;
}

export function categoriaFromRow(row: CategoriaRowExtendida): Categoria {
  return new Categoria(
    row.id_categoria,
    row.nombre,
    row.is_active === 1,
    row.total_productos !== undefined && row.total_productos !== null ? Number(row.total_productos) : undefined,
  );
}
