import { and, count, eq, inArray, like, or, type SQL, sql } from 'drizzle-orm';
import { Database } from '../../client.ts';
import {
  categorias,
  inventario_sucursal,
  movimientos_inventario,
  productos,
} from '../../schema/inventario.schema.ts';
import {
  DatosActualizarProducto,
  DatosCrearProducto,
  FiltrosListarProductos,
  IProductoRepository,
  Producto,
  ReferenciaInvalidaError,
  ResultadoPaginado,
  ResultadoProductosPaginado,
  ResumenStockSede,
  SkuDuplicadoError,
} from '@warengine/core';
import { productoFromRow } from '../../mappers/inventario/producto.mapper.ts';
import {
  esClaveDuplicada,
  escaparLike,
  esReferenciaInvalida,
} from '../../errors/mysql-error-translator.ts';

export class DrizzleProductoRepository implements IProductoRepository {
  constructor(private readonly db: Database) {}

  public async listar(filtros: FiltrosListarProductos): Promise<ResultadoProductosPaginado> {
    const condicionesBase: SQL[] = [];

    if (filtros.texto) {
      const patron = `%${escaparLike(filtros.texto)}%`;
      condicionesBase.push(
        or(
          like(productos.nombre, patron),
          like(productos.sku, patron),
        ) as SQL,
      );
    }

    if (filtros.sinCategoria || filtros.categoriaId === -1) {
      condicionesBase.push(sql`${productos.categoria_id} IS NULL`);
    } else if (filtros.categoriaId !== undefined) {
      condicionesBase.push(eq(productos.categoria_id, filtros.categoriaId));
    }

    if (filtros.proveedorId !== undefined) {
      condicionesBase.push(eq(productos.proveedor_id, filtros.proveedorId));
    }

    if (filtros.isActive !== undefined) {
      condicionesBase.push(eq(productos.is_active, filtros.isActive ? 1 : 0));
    } else if (filtros.estado) {
      if (filtros.estado === 'activo') condicionesBase.push(eq(productos.is_active, 1));
      else if (filtros.estado === 'inactivo') condicionesBase.push(eq(productos.is_active, 0));
    }

    const condiciones: SQL[] = [...condicionesBase];

    if (filtros.sucursalId !== undefined) {
      if (filtros.nivelStock && filtros.nivelStock !== 'todos') {
        const stockActualSql = sql`COALESCE(${inventario_sucursal.stock_actual}, 0)`;
        const stockMinimoSql = sql`COALESCE(${inventario_sucursal.stock_minimo}, 0)`;
        if (filtros.nivelStock === 'agotado') {
          condiciones.push(sql`${stockActualSql} <= 0`);
        } else if (filtros.nivelStock === 'bajo') {
          condiciones.push(sql`${stockActualSql} > 0 AND ${stockActualSql} <= ${stockMinimoSql}`);
        } else if (filtros.nivelStock === 'optimo') {
          condiciones.push(sql`${stockActualSql} > ${stockMinimoSql}`);
        }
      }
    } else if (filtros.stockBajo) {
      const subquery = this.db
        .select({ productoId: inventario_sucursal.producto_id })
        .from(inventario_sucursal)
        .where(sql`${inventario_sucursal.stock_actual} <= ${inventario_sucursal.stock_minimo}`);
      condiciones.push(inArray(productos.id_producto, subquery));
    }

    let resumen: ResumenStockSede | undefined = undefined;
    if (filtros.sucursalId !== undefined) {
      const whereBase = condicionesBase.length > 0 ? and(...condicionesBase) : undefined;
      const stockActualSql = sql`COALESCE(${inventario_sucursal.stock_actual}, 0)`;
      const stockMinimoSql = sql`COALESCE(${inventario_sucursal.stock_minimo}, 0)`;

      const [resumenRow] = await this.db
        .select({
          total: count(),
          agotado: sql<number>`COALESCE(SUM(CASE WHEN ${stockActualSql} <= 0 THEN 1 ELSE 0 END), 0)`,
          bajo: sql<number>`COALESCE(SUM(CASE WHEN ${stockActualSql} > 0 AND ${stockActualSql} <= ${stockMinimoSql} THEN 1 ELSE 0 END), 0)`,
          optimo: sql<number>`COALESCE(SUM(CASE WHEN ${stockActualSql} > ${stockMinimoSql} THEN 1 ELSE 0 END), 0)`,
        })
        .from(productos)
        .leftJoin(
          inventario_sucursal,
          and(
            eq(inventario_sucursal.producto_id, productos.id_producto),
            eq(inventario_sucursal.sucursal_id, filtros.sucursalId),
          ),
        )
        .where(whereBase);

      if (resumenRow) {
        resumen = {
          total: Number(resumenRow.total ?? 0),
          agotado: Number(resumenRow.agotado ?? 0),
          bajo: Number(resumenRow.bajo ?? 0),
          optimo: Number(resumenRow.optimo ?? 0),
        };
      }
    }

    const whereClause = condiciones.length > 0 ? and(...condiciones) : undefined;

    let total = 0;
    if (filtros.sucursalId !== undefined) {
      const [{ totalCount }] = await this.db
        .select({ totalCount: count() })
        .from(productos)
        .leftJoin(
          inventario_sucursal,
          and(
            eq(inventario_sucursal.producto_id, productos.id_producto),
            eq(inventario_sucursal.sucursal_id, filtros.sucursalId),
          ),
        )
        .where(whereClause);
      total = Number(totalCount ?? 0);
    } else {
      const [{ totalCount }] = await this.db
        .select({ totalCount: count() })
        .from(productos)
        .where(whereClause);
      total = Number(totalCount ?? 0);
    }

    const limit = Math.max(1, filtros.limit);
    const page = Math.max(1, filtros.page);
    const offset = (page - 1) * limit;

    let rows: any[] = [];
    if (filtros.sucursalId !== undefined) {
      rows = await this.db
        .select({
          id_producto: productos.id_producto,
          sku: productos.sku,
          nombre: productos.nombre,
          categoria_id: productos.categoria_id,
          categoria_nombre: categorias.nombre,
          proveedor_id: productos.proveedor_id,
          precio_compra: productos.precio_compra,
          precio_venta: productos.precio_venta,
          precio_corporativo: productos.precio_corporativo,
          precio_corporativo_actualizado_en: productos.precio_corporativo_actualizado_en,
          is_active: productos.is_active,
          stock_actual: sql<number>`COALESCE(${inventario_sucursal.stock_actual}, 0)`,
          stock_minimo: sql<number>`COALESCE(${inventario_sucursal.stock_minimo}, 0)`,
        })
        .from(productos)
        .leftJoin(categorias, eq(productos.categoria_id, categorias.id_categoria))
        .leftJoin(
          inventario_sucursal,
          and(
            eq(inventario_sucursal.producto_id, productos.id_producto),
            eq(inventario_sucursal.sucursal_id, filtros.sucursalId),
          ),
        )
        .where(whereClause)
        .orderBy(productos.nombre)
        .limit(limit)
        .offset(offset);
    } else {
      rows = await this.db
        .select({
          id_producto: productos.id_producto,
          sku: productos.sku,
          nombre: productos.nombre,
          categoria_id: productos.categoria_id,
          categoria_nombre: categorias.nombre,
          proveedor_id: productos.proveedor_id,
          precio_compra: productos.precio_compra,
          precio_venta: productos.precio_venta,
          precio_corporativo: productos.precio_corporativo,
          precio_corporativo_actualizado_en: productos.precio_corporativo_actualizado_en,
          is_active: productos.is_active,
          stock_actual: sql`NULL`,
          stock_minimo: sql`NULL`,
        })
        .from(productos)
        .leftJoin(categorias, eq(productos.categoria_id, categorias.id_categoria))
        .where(whereClause)
        .orderBy(productos.nombre)
        .limit(limit)
        .offset(offset);
    }

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: rows.map(productoFromRow),
      total,
      page,
      limit,
      totalPages,
      resumen,
      contadores: resumen,
    };
  }

  public async findById(id: string): Promise<Producto | null> {
    const [row] = await this.db
      .select()
      .from(productos)
      .where(eq(productos.id_producto, id))
      .limit(1);
    return row ? productoFromRow(row) : null;
  }

  public async findBySku(sku: string): Promise<Producto | null> {
    const [row] = await this.db
      .select()
      .from(productos)
      .where(eq(productos.sku, sku))
      .limit(1);
    return row ? productoFromRow(row) : null;
  }

  public async crear(datos: DatosCrearProducto): Promise<Producto> {
    const id = datos.id ?? crypto.randomUUID();

    try {
      await this.db.insert(productos).values({
        id_producto: id,
        sku: datos.sku,
        nombre: datos.nombre,
        categoria_id: datos.categoriaId ?? null,
        proveedor_id: datos.proveedorId ?? null,
        precio_compra: datos.precioCompra.toFixed(2),
        precio_venta: datos.precioVenta.toFixed(2),
        precio_corporativo:
          datos.precioCorporativo !== null && datos.precioCorporativo !== undefined
            ? datos.precioCorporativo.toFixed(2)
            : null,
        is_active: 1,
      });
    } catch (error) {
      if (esClaveDuplicada(error)) {
        throw new SkuDuplicadoError(datos.sku);
      }
      if (esReferenciaInvalida(error)) {
        throw new ReferenciaInvalidaError();
      }
      throw error;
    }

    return (await this.findById(id)) as Producto;
  }

  public async actualizar(
    id: string,
    cambios: DatosActualizarProducto,
  ): Promise<Producto> {
    const set: Partial<typeof productos.$inferInsert> = {};
    if (cambios.sku !== undefined) set.sku = cambios.sku;
    if (cambios.nombre !== undefined) set.nombre = cambios.nombre;
    if (cambios.categoriaId !== undefined) set.categoria_id = cambios.categoriaId;
    if (cambios.proveedorId !== undefined) set.proveedor_id = cambios.proveedorId;
    if (cambios.precioCompra !== undefined) set.precio_compra = cambios.precioCompra.toFixed(2);
    if (cambios.precioVenta !== undefined) set.precio_venta = cambios.precioVenta.toFixed(2);
    if (cambios.precioCorporativo !== undefined) {
      set.precio_corporativo =
        cambios.precioCorporativo !== null ? cambios.precioCorporativo.toFixed(2) : null;
    }
    if (cambios.isActive !== undefined) set.is_active = cambios.isActive ? 1 : 0;

    if (Object.keys(set).length > 0) {
      try {
        await this.db.update(productos).set(set).where(eq(productos.id_producto, id));
      } catch (error) {
        if (esClaveDuplicada(error)) {
          throw new SkuDuplicadoError(cambios.sku);
        }
        if (esReferenciaInvalida(error)) {
          throw new ReferenciaInvalidaError();
        }
        throw error;
      }
    }

    return (await this.findById(id)) as Producto;
  }

  public async cambiarEstado(id: string, isActive: boolean): Promise<Producto> {
    await this.db
      .update(productos)
      .set({ is_active: isActive ? 1 : 0 })
      .where(eq(productos.id_producto, id));
    return (await this.findById(id)) as Producto;
  }

  public async tieneMovimientos(id: string): Promise<boolean> {
    const [row] = await this.db
      .select({ total: count() })
      .from(movimientos_inventario)
      .where(eq(movimientos_inventario.producto_id, id));
    return Number(row?.total ?? 0) > 0;
  }

  public async contarActivosPorCategoria(categoriaId: number): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(productos)
      .where(
        and(
          eq(productos.categoria_id, categoriaId),
          eq(productos.is_active, 1),
        ),
      );
    return Number(row?.total ?? 0);
  }

  public async contarActivosPorProveedor(proveedorId: number): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(productos)
      .where(
        and(
          eq(productos.proveedor_id, proveedorId),
          eq(productos.is_active, 1),
        ),
      );
    return Number(row?.total ?? 0);
  }
}

