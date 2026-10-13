import { and, asc, count, eq, inArray, sql, type SQL } from 'drizzle-orm';
import type { ResultadoPaginado } from '@warengine/shared-kernel';
import { Database } from '../../client.ts';
import { sucursales } from '../../schema/administracion.schema.ts';
import { inventario_sucursal, productos } from '../../schema/inventario.schema.ts';
import { AlertaStock, FiltrosAlertasStock, IAlertaStockRepository } from '@warengine/core';
import { alertaStockFromRow } from '../../mappers/administracion/alerta-stock.mapper.ts';

export class DrizzleAlertaStockRepository implements IAlertaStockRepository {
  constructor(private readonly db: Database) {}

  public async listar(filtros: FiltrosAlertasStock): Promise<ResultadoPaginado<AlertaStock>> {
    const condiciones: SQL[] = [
      eq(productos.is_active, 1),
      sql`${inventario_sucursal.stock_actual} <= ${inventario_sucursal.stock_minimo}`,
    ];
    if (filtros.sucursalIds !== undefined) {
      condiciones.push(inArray(inventario_sucursal.sucursal_id, filtros.sucursalIds));
    }
    const where = and(...condiciones);

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(inventario_sucursal)
      .innerJoin(productos, eq(inventario_sucursal.producto_id, productos.id_producto))
      .where(where);

    const rows = await this.db
      .select({
        productoId: productos.id_producto,
        sku: productos.sku,
        nombre: productos.nombre,
        sucursalId: sucursales.id_sucursal,
        sucursalNombre: sucursales.nombre,
        stockActual: inventario_sucursal.stock_actual,
        stockMinimo: inventario_sucursal.stock_minimo,
      })
      .from(inventario_sucursal)
      .innerJoin(productos, eq(inventario_sucursal.producto_id, productos.id_producto))
      .innerJoin(sucursales, eq(inventario_sucursal.sucursal_id, sucursales.id_sucursal))
      .where(where)
      // Lo más crítico primero: mayor déficit frente al mínimo.
      .orderBy(
        asc(sql`${inventario_sucursal.stock_actual} - ${inventario_sucursal.stock_minimo}`),
        asc(productos.nombre),
        asc(sucursales.id_sucursal),
      )
      .limit(filtros.limit)
      .offset((filtros.page - 1) * filtros.limit);

    const totalNumero = Number(total);
    return {
      items: rows.map(alertaStockFromRow),
      total: totalNumero,
      page: filtros.page,
      limit: filtros.limit,
      totalPages: Math.ceil(totalNumero / filtros.limit) || 1,
    };
  }
}