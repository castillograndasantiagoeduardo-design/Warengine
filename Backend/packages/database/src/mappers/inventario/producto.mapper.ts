import { Producto } from '@warengine/core';
import { ProductoRecord } from '../../schema/inventario.schema.ts';

export interface ProductoRowExtendido extends ProductoRecord {
  categoria_nombre?: string | null;
  stock_actual?: number | string | null;
  stock_minimo?: number | string | null;
  estado_stock?: 'optimo' | 'bajo' | 'agotado' | null;
}

export function productoFromRow(row: ProductoRowExtendido): Producto {
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
    undefined,
    row.categoria_nombre ?? undefined,
    row.stock_actual !== undefined && row.stock_actual !== null ? Number(row.stock_actual) : undefined,
    row.stock_minimo !== undefined && row.stock_minimo !== null ? Number(row.stock_minimo) : undefined,
    row.estado_stock ?? undefined,
  );
}
