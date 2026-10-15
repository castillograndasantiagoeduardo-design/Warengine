import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { Database } from '../../client.ts';
import {
  inventario_sucursal,
  movimientos_inventario,
  productos,
  proveedores,
} from '../../schema/inventario.schema.ts';
import { empleados, sucursales } from '../../schema/administracion.schema.ts';
import { usuarios } from '../../schema/autenticacion.schema.ts';
import {
  DatosRegistroEntrada,
  DatosRegistroSalida,
  FiltrosKardex,
  IMovimientoInventarioRepository,
  ItemKardex,
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

  /**
   * RF-ADM-B10: Consulta paginada del histórico de movimientos (Kardex).
   * Devuelve entradas, salidas y ajustes ordenados cronológicamente descendente.
   */
  public async consultarKardex(filtros: FiltrosKardex): Promise<{ items: ItemKardex[]; total: number }> {
    const conditions = [];

    if (filtros.productoId) {
      conditions.push(eq(movimientos_inventario.producto_id, filtros.productoId));
    }

    if (filtros.sucursalId !== undefined) {
      conditions.push(eq(movimientos_inventario.sucursal_id, filtros.sucursalId));
    } else if (filtros.sucursalIds && filtros.sucursalIds.length > 0) {
      conditions.push(inArray(movimientos_inventario.sucursal_id, filtros.sucursalIds));
    }

    if (filtros.tipo) {
      conditions.push(eq(movimientos_inventario.tipo, filtros.tipo));
    }

    if (filtros.proveedorId !== undefined) {
      conditions.push(eq(movimientos_inventario.proveedor_id, filtros.proveedorId));
    }

    if (filtros.desde) {
      conditions.push(gte(movimientos_inventario.fecha, filtros.desde));
    }

    if (filtros.hasta) {
      conditions.push(lte(movimientos_inventario.fecha, filtros.hasta));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 1. Conteo total de registros que cumplen los filtros
    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(movimientos_inventario)
      .where(whereClause);
    const total = Number(countResult?.count ?? 0);

    // 2. Consulta de registros con información legible de producto, sucursal, proveedor y responsable
    const rows = await this.db
      .select({
        id: movimientos_inventario.id_movimiento_inventario,
        productoId: movimientos_inventario.producto_id,
        productoNombre: productos.nombre,
        productoSku: productos.sku,
        sucursalId: movimientos_inventario.sucursal_id,
        sucursalNombre: sucursales.nombre,
        tipo: movimientos_inventario.tipo,
        cantidad: movimientos_inventario.cantidad,
        motivo: movimientos_inventario.motivo,
        proveedorId: movimientos_inventario.proveedor_id,
        proveedorNombre: proveedores.nombre,
        facturaId: movimientos_inventario.factura_id,
        devolucionId: movimientos_inventario.devolucion_id,
        usuarioId: movimientos_inventario.usuario_id,
        usuarioNombre: empleados.nombre,
        fecha: movimientos_inventario.fecha,
      })
      .from(movimientos_inventario)
      .leftJoin(productos, eq(movimientos_inventario.producto_id, productos.id_producto))
      .leftJoin(sucursales, eq(movimientos_inventario.sucursal_id, sucursales.id_sucursal))
      .leftJoin(proveedores, eq(movimientos_inventario.proveedor_id, proveedores.id_proveedor))
      .leftJoin(usuarios, eq(movimientos_inventario.usuario_id, usuarios.id_usuario))
      .leftJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
      .where(whereClause)
      .orderBy(desc(movimientos_inventario.fecha))
      .limit(filtros.limit)
      .offset(filtros.offset);

    const items: ItemKardex[] = rows.map((r) => ({
      id: r.id,
      productoId: r.productoId,
      productoNombre: r.productoNombre ?? undefined,
      productoSku: r.productoSku ?? undefined,
      sucursalId: r.sucursalId,
      sucursalNombre: r.sucursalNombre ?? undefined,
      tipo: r.tipo as 'entrada' | 'salida' | 'ajuste_entrada' | 'ajuste_salida',
      cantidad: r.cantidad,
      motivo: r.motivo,
      proveedorId: r.proveedorId,
      proveedorNombre: r.proveedorNombre,
      facturaId: r.facturaId,
      devolucionId: r.devolucionId,
      usuarioId: r.usuarioId,
      usuarioNombre: r.usuarioNombre,
      fecha: r.fecha,
    }));

    return { items, total };
  }

  /**
   * RF-ADM-B15: Consulta un movimiento de inventario por su ID único.
   */
  public async obtenerPorId(id: string): Promise<ItemKardex | null> {
    const [row] = await this.db
      .select({
        id: movimientos_inventario.id_movimiento_inventario,
        productoId: movimientos_inventario.producto_id,
        productoNombre: productos.nombre,
        productoSku: productos.sku,
        sucursalId: movimientos_inventario.sucursal_id,
        sucursalNombre: sucursales.nombre,
        tipo: movimientos_inventario.tipo,
        cantidad: movimientos_inventario.cantidad,
        motivo: movimientos_inventario.motivo,
        proveedorId: movimientos_inventario.proveedor_id,
        proveedorNombre: proveedores.nombre,
        facturaId: movimientos_inventario.factura_id,
        devolucionId: movimientos_inventario.devolucion_id,
        usuarioId: movimientos_inventario.usuario_id,
        usuarioNombre: empleados.nombre,
        fecha: movimientos_inventario.fecha,
      })
      .from(movimientos_inventario)
      .leftJoin(productos, eq(movimientos_inventario.producto_id, productos.id_producto))
      .leftJoin(sucursales, eq(movimientos_inventario.sucursal_id, sucursales.id_sucursal))
      .leftJoin(proveedores, eq(movimientos_inventario.proveedor_id, proveedores.id_proveedor))
      .leftJoin(usuarios, eq(movimientos_inventario.usuario_id, usuarios.id_usuario))
      .leftJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
      .where(eq(movimientos_inventario.id_movimiento_inventario, id));

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      productoId: row.productoId,
      productoNombre: row.productoNombre ?? undefined,
      productoSku: row.productoSku ?? undefined,
      sucursalId: row.sucursalId,
      sucursalNombre: row.sucursalNombre ?? undefined,
      tipo: row.tipo as 'entrada' | 'salida' | 'ajuste_entrada' | 'ajuste_salida',
      cantidad: row.cantidad,
      motivo: row.motivo,
      proveedorId: row.proveedorId,
      proveedorNombre: row.proveedorNombre,
      facturaId: row.facturaId,
      devolucionId: row.devolucionId,
      usuarioId: row.usuarioId,
      usuarioNombre: row.usuarioNombre,
      fecha: row.fecha,
    };
  }
}
