import { and, eq, sql } from 'drizzle-orm';
import { Database } from '../../client.ts';
import {
  inventario_sucursal,
  movimientos_inventario,
} from '../../schema/inventario.schema.ts';
import {
  DatosRegistroEntrada,
  DatosRegistroSalida,
  IMovimientoInventarioRepository,
  MovimientoInventario,
  StockInsuficienteError,
} from '@warengine/core';

export class DrizzleMovimientoInventarioRepository implements IMovimientoInventarioRepository {
  constructor(private readonly db: Database) {}

  public async obtenerStockActual(productoId: string, sucursalId: number): Promise<number> {
    const [row] = await this.db
      .select({ stockActual: inventario_sucursal.stock_actual })
      .from(inventario_sucursal)
      .where(
        and(
          eq(inventario_sucursal.producto_id, productoId),
          eq(inventario_sucursal.sucursal_id, sucursalId),
        ),
      );
    return row?.stockActual ?? 0;
  }

  public async registrarEntrada(datos: DatosRegistroEntrada): Promise<MovimientoInventario> {
    return await this.db.transaction(async (tx) => {
      // 1. Insertar o incrementar stock en inventario_sucursal
      await tx
        .insert(inventario_sucursal)
        .values({
          producto_id: datos.productoId,
          sucursal_id: datos.sucursalId,
          stock_actual: datos.cantidad,
          stock_minimo: 0,
        })
        .onDuplicateKeyUpdate({
          set: {
            stock_actual: sql`${inventario_sucursal.stock_actual} + ${datos.cantidad}`,
          },
        });

      // 2. Registrar movimiento inmutable
      const id = crypto.randomUUID();
      const fecha = new Date();

      await tx.insert(movimientos_inventario).values({
        id_movimiento_inventario: id,
        producto_id: datos.productoId,
        sucursal_id: datos.sucursalId,
        tipo: 'entrada',
        cantidad: datos.cantidad,
        motivo: datos.motivo ?? null,
        proveedor_id: datos.proveedorId ?? null,
        usuario_id: datos.usuarioId,
        fecha,
      });

      // 3. Obtener el stock resultante
      const [inv] = await tx
        .select({ stockActual: inventario_sucursal.stock_actual })
        .from(inventario_sucursal)
        .where(
          and(
            eq(inventario_sucursal.producto_id, datos.productoId),
            eq(inventario_sucursal.sucursal_id, datos.sucursalId),
          ),
        );

      return {
        id,
        productoId: datos.productoId,
        sucursalId: datos.sucursalId,
        tipo: 'entrada',
        cantidad: datos.cantidad,
        motivo: datos.motivo ?? null,
        proveedorId: datos.proveedorId ?? null,
        usuarioId: datos.usuarioId,
        fecha,
        stockResultante: inv?.stockActual ?? datos.cantidad,
      };
    });
  }

  public async registrarSalida(datos: DatosRegistroSalida): Promise<MovimientoInventario> {
    return await this.db.transaction(async (tx) => {
      // 1. Verificar existencias actuales en la sucursal
      const [inv] = await tx
        .select({ stockActual: inventario_sucursal.stock_actual })
        .from(inventario_sucursal)
        .where(
          and(
            eq(inventario_sucursal.producto_id, datos.productoId),
            eq(inventario_sucursal.sucursal_id, datos.sucursalId),
          ),
        );

      const stockActual = inv?.stockActual ?? 0;
      if (stockActual < datos.cantidad) {
        throw new StockInsuficienteError(stockActual, datos.cantidad);
      }

      // 2. Actualizar existencias restando la cantidad
      await tx
        .update(inventario_sucursal)
        .set({
          stock_actual: sql`${inventario_sucursal.stock_actual} - ${datos.cantidad}`,
        })
        .where(
          and(
            eq(inventario_sucursal.producto_id, datos.productoId),
            eq(inventario_sucursal.sucursal_id, datos.sucursalId),
          ),
        );

      // 3. Registrar movimiento inmutable
      const id = crypto.randomUUID();
      const fecha = new Date();

      await tx.insert(movimientos_inventario).values({
        id_movimiento_inventario: id,
        producto_id: datos.productoId,
        sucursal_id: datos.sucursalId,
        tipo: 'salida',
        cantidad: datos.cantidad,
        motivo: datos.motivo,
        usuario_id: datos.usuarioId,
        fecha,
      });

      return {
        id,
        productoId: datos.productoId,
        sucursalId: datos.sucursalId,
        tipo: 'salida',
        cantidad: datos.cantidad,
        motivo: datos.motivo,
        usuarioId: datos.usuarioId,
        fecha,
        stockResultante: stockActual - datos.cantidad,
      };
    });
  }
}
