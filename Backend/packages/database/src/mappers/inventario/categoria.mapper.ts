import { Categoria } from '@warengine/core';
import { CategoriaRecord } from '../../schema/inventario.schema.ts';

export function categoriaFromRow(row: CategoriaRecord): Categoria {
  return new Categoria(row.id_categoria, row.nombre, row.is_active === 1);
}
