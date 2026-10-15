import { and, eq } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { inventario_sucursal, productos } from '../../schema/inventario.schema.ts';
import { sucursales } from '../../schema/administracion.schema.ts';
import {
  DatosDetalleStockSucursal,
  IInventarioSucursalRepository,
  InventarioSucursal,
} from '@warengine/core';

/**
 * Implementación Drizzle ORM para el repositorio de inventario por sucursal (RF-ADM-B11).
 * Gestiona el umbral de stock_minimo y existencias en la tabla inventario_sucursal.
 */
export class DrizzleInventarioSucursalRepository implements IInventarioSucursalRepository {
  constructor(private readonly db: Database) {}

  public async obtener(
    productoId: string,
    sucursalId: number,
  ): Promise<InventarioSucursal | null> {
    const [row] = await this.db
      .select()
      .from(inventario_sucursal)
      .where(
        and(
          eq(inventario_sucursal.producto_id, productoId),
          eq(inventario_sucursal.sucursal_id, sucursalId),
        ),
      )
      .limit(1);

    if (!row) return null;

    return new InventarioSucursal(
      row.producto_id,
      row.sucursal_id,
      Number(row.stock_actual),
      Number(row.stock_minimo),
    );
  }

  public async obtenerDetalle(
    productoId: string,
    sucursalId: number,
  ): Promise<DatosDetalleStockSucursal | null> {
    const [row] = await this.db
      .select({
        productoId: productos.id_producto,
        nombreProducto: productos.nombre,
        sku: productos.sku,
        sucursalId: sucursales.id_sucursal,
        nombreSucursal: sucursales.nombre,
        stockActual: inventario_sucursal.stock_actual,
        stockMinimo: inventario_sucursal.stock_minimo,
      })
      .from(inventario_sucursal)
      .innerJoin(productos, eq(inventario_sucursal.producto_id, productos.id_producto))
      .innerJoin(sucursales, eq(inventario_sucursal.sucursal_id, sucursales.id_sucursal))
      .where(
        and(
          eq(inventario_sucursal.producto_id, productoId),
          eq(inventario_sucursal.sucursal_id, sucursalId),
        ),
      )
      .limit(1);

    if (!row) return null;

    const stockActual = Number(row.stockActual);
    const stockMinimo = Number(row.stockMinimo);

    return {
      productoId: row.productoId,
      nombreProducto: row.nombreProducto,
      sku: row.sku,
      sucursalId: Number(row.sucursalId),
      nombreSucursal: row.nombreSucursal,
      stockActual,
      stockMinimo,
      alertaAbastecimiento: stockActual <= stockMinimo,
    };
  }

  public async establecerStockMinimo(
    productoId: string,
    sucursalId: number,
    stockMinimo: number,
  ): Promise<InventarioSucursal> {
    await this.db
      .insert(inventario_sucursal)
      .values({
        producto_id: productoId,
        sucursal_id: sucursalId,
        stock_actual: 0,
        stock_minimo: stockMinimo,
      })
      .onDuplicateKeyUpdate({
        set: {
          stock_minimo: stockMinimo,
        },
      });

    const actualizado = await this.obtener(productoId, sucursalId);
    return actualizado!;
  }
}
