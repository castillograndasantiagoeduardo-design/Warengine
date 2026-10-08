import { and, count, eq, inArray, like, or, type SQL, sql } from 'drizzle-orm';
import { Database } from '../../client.ts';
import {
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

  public async listar(filtros: FiltrosListarProductos): Promise<ResultadoPaginado<Producto>> {
    const condiciones: SQL[] = [];

    if (filtros.texto) {
      const patron = `%${escaparLike(filtros.texto)}%`;
      condiciones.push(
        or(
          like(productos.nombre, patron),
          like(productos.sku, patron),
        ) as SQL,
      );
    }

    if (filtros.categoriaId !== undefined) {
      condiciones.push(eq(productos.categoria_id, filtros.categoriaId));
    }

    if (filtros.proveedorId !== undefined) {
      condiciones.push(eq(productos.proveedor_id, filtros.proveedorId));
    }

    if (filtros.isActive !== undefined) {
      condiciones.push(eq(productos.is_active, filtros.isActive ? 1 : 0));
    }

    if (filtros.stockBajo) {
      if (filtros.sucursalId !== undefined) {
        // Filtro específico para la sucursal indicada
        const subquery = this.db
          .select({ productoId: inventario_sucursal.producto_id })
          .from(inventario_sucursal)
          .where(
            and(
              eq(inventario_sucursal.sucursal_id, filtros.sucursalId),
              sql`${inventario_sucursal.stock_actual} <= ${inventario_sucursal.stock_minimo}`,
            ),
          );
        condiciones.push(inArray(productos.id_producto, subquery));
      } else {
        // Filtro general: productos con stock bajo en al menos una sucursal
        const subquery = this.db
          .select({ productoId: inventario_sucursal.producto_id })
          .from(inventario_sucursal)
          .where(sql`${inventario_sucursal.stock_actual} <= ${inventario_sucursal.stock_minimo}`);
        condiciones.push(inArray(productos.id_producto, subquery));
      }
    }

    const whereClause = condiciones.length > 0 ? and(...condiciones) : undefined;

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(productos)
      .where(whereClause);

    const limit = Math.max(1, filtros.limit);
    const page = Math.max(1, filtros.page);
    const offset = (page - 1) * limit;

    const rows = await this.db
      .select()
      .from(productos)
      .where(whereClause)
      .orderBy(productos.nombre)
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: rows.map(productoFromRow),
      total: Number(total),
      page,
      limit,
      totalPages,
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
}
