import { Producto } from '@warengine/core';
import { ProductoRecord } from '../../schema/inventario.schema.ts';

export function productoFromRow(row: ProductoRecord): Producto {
  return new Producto(
    row.id_producto,
    row.sku,
    row.nombre,
    row.categoria_id,
    row.proveedor_id,
    Number(row.precio_compra),
    Number(row.precio_venta),
    row.precio_corporativo !== null ? Number(row.precio_corporativo) : null,
    row.precio_corporativo_actualizado_en,
    row.is_active === 1,
  );
}
