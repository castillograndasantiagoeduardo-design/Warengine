import { and, asc, desc, eq, gte, inArray, isNull, lte, sql, type SQL } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { sucursales } from '../../schema/administracion.schema.ts';
import { facturas, factura_items } from '../../schema/facturacion.schema.ts';
import { categorias, inventario_sucursal, productos } from '../../schema/inventario.schema.ts';
import type {
  ExistenciaSucursalItem,
  FiltroComparativoInventario,
  FiltroMetricasGanancias,
  FiltroRankingProductos,
  FiltroRendimientoSucursales,
  FiltroTendenciasVentas,
  IMetricasAdminRepository,
  ItemComparativoInventario,
  ItemRankingProducto,
  MetricasGanancias,
  PuntoTendenciaVenta,
  RendimientoSucursal,
} from '@warengine/core';

export class DrizzleMetricasAdminRepository implements IMetricasAdminRepository {
  constructor(private readonly db: Database) {}

  public async obtenerMetricasGanancias(filtro: FiltroMetricasGanancias): Promise<MetricasGanancias> {
    const condicionesFacturas: SQL[] = [
      eq(facturas.estado, 'emitida'),
      isNull(facturas.deleted_at),
    ];

    if (filtro.sucursalId !== undefined) {
      condicionesFacturas.push(eq(facturas.sucursal_id, filtro.sucursalId));
    }
    if (filtro.desde !== undefined) {
      condicionesFacturas.push(gte(facturas.fecha, filtro.desde));
    }
    if (filtro.hasta !== undefined) {
      condicionesFacturas.push(lte(facturas.fecha, filtro.hasta));
    }

    // 1. Ingresos totales y cantidad de facturas
    const [facturasAgg] = await this.db
      .select({
        ingresosTotales: sql<string>`COALESCE(SUM(${facturas.total}), '0.00')`,
        totalFacturas: sql<number>`COUNT(${facturas.id_factura})`,
      })
      .from(facturas)
      .where(and(...condicionesFacturas));

    // 2. Costo total de los productos vendidos
    const condicionesItems: SQL[] = [
      eq(facturas.estado, 'emitida'),
      isNull(facturas.deleted_at),
      isNull(factura_items.deleted_at),
    ];
    if (filtro.sucursalId !== undefined) {
      condicionesItems.push(eq(facturas.sucursal_id, filtro.sucursalId));
    }
    if (filtro.desde !== undefined) {
      condicionesItems.push(gte(facturas.fecha, filtro.desde));
    }
    if (filtro.hasta !== undefined) {
      condicionesItems.push(lte(facturas.fecha, filtro.hasta));
    }

    const [costoAgg] = await this.db
      .select({
        costoTotal: sql<string>`COALESCE(SUM(${factura_items.cantidad} * ${productos.precio_compra}), '0.00')`,
      })
      .from(factura_items)
      .innerJoin(facturas, eq(factura_items.factura_id, facturas.id_factura))
      .innerJoin(productos, eq(factura_items.producto_id, productos.id_producto))
      .where(and(...condicionesItems));

    const ingresosTotales = Number(Number(facturasAgg?.ingresosTotales ?? 0).toFixed(2));
    const costoTotal = Number(Number(costoAgg?.costoTotal ?? 0).toFixed(2));
    const gananciaNeta = Number((ingresosTotales - costoTotal).toFixed(2));
    const margenPorcentaje = ingresosTotales > 0
      ? Number(((gananciaNeta / ingresosTotales) * 100).toFixed(2))
      : 0;
    const totalFacturas = Number(facturasAgg?.totalFacturas ?? 0);
    const ticketPromedio = totalFacturas > 0
      ? Number((ingresosTotales / totalFacturas).toFixed(2))
      : 0;

    return {
      ingresosTotales,
      costoTotal,
      gananciaNeta,
      margenPorcentaje,
      totalFacturas,
      ticketPromedio,
    };
  }

  public async obtenerTendenciasVentas(filtro: FiltroTendenciasVentas): Promise<PuntoTendenciaVenta[]> {
    const formatoSql = filtro.agrupacion === 'dia'
      ? sql`DATE_FORMAT(${facturas.fecha}, '%Y-%m-%d')`
      : filtro.agrupacion === 'mes'
      ? sql`DATE_FORMAT(${facturas.fecha}, '%Y-%m')`
      : sql`CONCAT(YEAR(${facturas.fecha}), '-W', LPAD(WEEK(${facturas.fecha}, 1), 2, '0'))`;

    const condiciones: SQL[] = [
      eq(facturas.estado, 'emitida'),
      isNull(facturas.deleted_at),
      isNull(factura_items.deleted_at),
    ];
    if (filtro.sucursalId !== undefined) {
      condiciones.push(eq(facturas.sucursal_id, filtro.sucursalId));
    }
    if (filtro.desde !== undefined) {
      condiciones.push(gte(facturas.fecha, filtro.desde));
    }
    if (filtro.hasta !== undefined) {
      condiciones.push(lte(facturas.fecha, filtro.hasta));
    }

    const rows = await this.db
      .select({
        periodo: sql<string>`${formatoSql}`,
        totalVentas: sql<string>`COALESCE(SUM(${factura_items.subtotal}), '0.00')`,
        costoTotal: sql<string>`COALESCE(SUM(${factura_items.cantidad} * ${productos.precio_compra}), '0.00')`,
        cantidadFacturas: sql<number>`COUNT(DISTINCT ${facturas.id_factura})`,
      })
      .from(facturas)
      .innerJoin(factura_items, eq(facturas.id_factura, factura_items.factura_id))
      .innerJoin(productos, eq(factura_items.producto_id, productos.id_producto))
      .where(and(...condiciones))
      .groupBy(sql`${formatoSql}`)
      .orderBy(asc(sql`${formatoSql}`));

    return rows.map((r) => {
      const ventas = Number(Number(r.totalVentas).toFixed(2));
      const costo = Number(Number(r.costoTotal).toFixed(2));
      return {
        periodo: r.periodo,
        totalVentas: ventas,
        totalGanancias: Number((ventas - costo).toFixed(2)),
        cantidadFacturas: Number(r.cantidadFacturas),
      };
    });
  }

  public async obtenerRendimientoSucursales(filtro: FiltroRendimientoSucursales): Promise<RendimientoSucursal[]> {
    const condicionesSucursales: SQL[] = [
      eq(sucursales.is_active, 1),
    ];
    if (filtro.sucursalIds && filtro.sucursalIds.length > 0) {
      condicionesSucursales.push(inArray(sucursales.id_sucursal, filtro.sucursalIds));
    }

    const condicionesJoinFacturas: SQL[] = [
      eq(facturas.estado, 'emitida'),
      isNull(facturas.deleted_at),
    ];
    if (filtro.desde !== undefined) {
      condicionesJoinFacturas.push(gte(facturas.fecha, filtro.desde));
    }
    if (filtro.hasta !== undefined) {
      condicionesJoinFacturas.push(lte(facturas.fecha, filtro.hasta));
    }

    const rows = await this.db
      .select({
        sucursalId: sucursales.id_sucursal,
        nombreSucursal: sucursales.nombre,
        totalVentas: sql<string>`COALESCE(SUM(${factura_items.subtotal}), '0.00')`,
        costoTotal: sql<string>`COALESCE(SUM(${factura_items.cantidad} * ${productos.precio_compra}), '0.00')`,
        totalFacturas: sql<number>`COUNT(DISTINCT ${facturas.id_factura})`,
      })
      .from(sucursales)
      .leftJoin(
        facturas,
        and(
          eq(sucursales.id_sucursal, facturas.sucursal_id),
          ...condicionesJoinFacturas,
        ),
      )
      .leftJoin(
        factura_items,
        and(
          eq(facturas.id_factura, factura_items.factura_id),
          isNull(factura_items.deleted_at),
        ),
      )
      .leftJoin(productos, eq(factura_items.producto_id, productos.id_producto))
      .where(and(...condicionesSucursales))
      .groupBy(sucursales.id_sucursal, sucursales.nombre)
      .orderBy(desc(sql`SUM(${factura_items.subtotal})`));

    return rows.map((r) => {
      const totalVentas = Number(Number(r.totalVentas).toFixed(2));
      const costoTotal = Number(Number(r.costoTotal).toFixed(2));
      const totalFacturas = Number(r.totalFacturas);
      return {
        sucursalId: r.sucursalId,
        nombreSucursal: r.nombreSucursal,
        totalVentas,
        totalFacturas,
        ticketPromedio: totalFacturas > 0 ? Number((totalVentas / totalFacturas).toFixed(2)) : 0,
        gananciaNeta: Number((totalVentas - costoTotal).toFixed(2)),
      };
    });
  }

  public async obtenerRankingProductos(filtro: FiltroRankingProductos): Promise<ItemRankingProducto[]> {
    const condicionesFacturas: SQL[] = [
      eq(facturas.estado, 'emitida'),
      isNull(facturas.deleted_at),
    ];
    if (filtro.sucursalId !== undefined) {
      condicionesFacturas.push(eq(facturas.sucursal_id, filtro.sucursalId));
    }
    if (filtro.desde !== undefined) {
      condicionesFacturas.push(gte(facturas.fecha, filtro.desde));
    }
    if (filtro.hasta !== undefined) {
      condicionesFacturas.push(lte(facturas.fecha, filtro.hasta));
    }

    const orderDirection = filtro.orden === 'mas_vendidos' ? desc : asc;

    const rows = await this.db
      .select({
        productoId: productos.id_producto,
        sku: productos.sku,
        nombre: productos.nombre,
        cantidadVendida: sql<number>`COALESCE(SUM(${factura_items.cantidad}), 0)`,
        totalRecaudado: sql<string>`COALESCE(SUM(${factura_items.subtotal}), '0.00')`,
        costoTotal: sql<string>`COALESCE(SUM(${factura_items.cantidad} * ${productos.precio_compra}), '0.00')`,
      })
      .from(productos)
      .leftJoin(
        factura_items,
        and(
          eq(productos.id_producto, factura_items.producto_id),
          isNull(factura_items.deleted_at),
        ),
      )
      .leftJoin(
        facturas,
        and(
          eq(factura_items.factura_id, facturas.id_factura),
          ...condicionesFacturas,
        ),
      )
      .where(eq(productos.is_active, 1))
      .groupBy(productos.id_producto, productos.sku, productos.nombre)
      .orderBy(orderDirection(sql`SUM(${factura_items.cantidad})`), orderDirection(sql`SUM(${factura_items.subtotal})`))
      .limit(filtro.limite ?? 10);

    return rows.map((r) => {
      const totalRecaudado = Number(Number(r.totalRecaudado).toFixed(2));
      const costoTotal = Number(Number(r.costoTotal).toFixed(2));
      return {
        productoId: r.productoId,
        sku: r.sku,
        nombre: r.nombre,
        cantidadVendida: Number(r.cantidadVendida),
        totalRecaudado,
        gananciaGenerada: Number((totalRecaudado - costoTotal).toFixed(2)),
      };
    });
  }

  public async obtenerComparativoInventario(filtro: FiltroComparativoInventario): Promise<ItemComparativoInventario[]> {
    const condicionesProductos: SQL[] = [
      eq(productos.is_active, 1),
    ];
    if (filtro.productoId) {
      condicionesProductos.push(eq(productos.id_producto, filtro.productoId));
    }
    if (filtro.categoriaId) {
      condicionesProductos.push(eq(productos.categoria_id, filtro.categoriaId));
    }

    const condicionesSucursales: SQL[] = [
      eq(sucursales.is_active, 1),
    ];
    if (filtro.sucursalIds && filtro.sucursalIds.length > 0) {
      condicionesSucursales.push(inArray(sucursales.id_sucursal, filtro.sucursalIds));
    }

    // 1. Obtener sucursales activas involucradas
    const sedes = await this.db
      .select({
        id: sucursales.id_sucursal,
        nombre: sucursales.nombre,
      })
      .from(sucursales)
      .where(and(...condicionesSucursales))
      .orderBy(asc(sucursales.id_sucursal));

    if (sedes.length === 0) {
      return [];
    }

    // 2. Obtener productos con categorías
    const prods = await this.db
      .select({
        productoId: productos.id_producto,
        sku: productos.sku,
        nombre: productos.nombre,
        categoriaNombre: categorias.nombre,
      })
      .from(productos)
      .leftJoin(categorias, eq(productos.categoria_id, categorias.id_categoria))
      .where(and(...condicionesProductos))
      .orderBy(asc(productos.nombre));

    if (prods.length === 0) {
      return [];
    }

    // 3. Obtener existencias actuales en inventario_sucursal
    const existenciasRows = await this.db
      .select({
        productoId: inventario_sucursal.producto_id,
        sucursalId: inventario_sucursal.sucursal_id,
        stockActual: inventario_sucursal.stock_actual,
        stockMinimo: inventario_sucursal.stock_minimo,
      })
      .from(inventario_sucursal)
      .where(inArray(inventario_sucursal.sucursal_id, sedes.map((s) => s.id)));

    const mapaExistencias = new Map<string, { stockActual: number; stockMinimo: number }>();
    for (const row of existenciasRows) {
      mapaExistencias.set(`${row.productoId}-${row.sucursalId}`, {
        stockActual: Number(row.stockActual),
        stockMinimo: Number(row.stockMinimo),
      });
    }

    const resultado: ItemComparativoInventario[] = [];

    for (const prod of prods) {
      const existenciasPorSucursal: ExistenciaSucursalItem[] = [];
      let stockTotal = 0;
      let tieneStockBajo = false;

      for (const sede of sedes) {
        const itemStock = mapaExistencias.get(`${prod.productoId}-${sede.id}`) ?? { stockActual: 0, stockMinimo: 0 };
        const actual = itemStock.stockActual;
        const minimo = itemStock.stockMinimo;
        stockTotal += actual;

        let estadoStock: 'critico' | 'bajo' | 'optimo' = 'optimo';
        if (actual <= 0) {
          estadoStock = 'critico';
          tieneStockBajo = true;
        } else if (actual <= minimo) {
          estadoStock = 'bajo';
          tieneStockBajo = true;
        }

        existenciasPorSucursal.push({
          sucursalId: sede.id,
          nombreSucursal: sede.nombre,
          stockActual: actual,
          stockMinimo: minimo,
          estadoStock,
        });
      }

      if (filtro.soloConStockBajo && !tieneStockBajo) {
        continue;
      }

      resultado.push({
        productoId: prod.productoId,
        sku: prod.sku,
        nombre: prod.nombre,
        categoriaNombre: prod.categoriaNombre ?? undefined,
        existenciasPorSucursal,
        stockTotal,
      });
    }

    return resultado;
  }
}
