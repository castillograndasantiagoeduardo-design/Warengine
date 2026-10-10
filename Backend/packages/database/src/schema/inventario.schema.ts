import { sql } from 'drizzle-orm';
import {
  char,
  check,
  datetime,
  decimal,
  index,
  int,
  mysqlTable,
  primaryKey,
  tinyint,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import { varcharBin } from './column-types.ts';
import { sucursales } from './administracion.schema.ts';
import { usuarios } from './autenticacion.schema.ts';

/**
 * Tabla: categorias
 * Categorías globales de productos vendibles.
 * Coincide exactamente con WARENGINE_FULL_BD.sql
 */
export const categorias = mysqlTable('categorias', {
  id_categoria: int('id_categoria').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  is_active: tinyint('is_active').notNull().default(1),
});

/**
 * Tabla: proveedores
 * Proveedores globales de productos y servicios.
 * Coincide exactamente con WARENGINE_FULL_BD.sql
 */
export const proveedores = mysqlTable('proveedores', {
  id_proveedor: int('id_proveedor').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 150 }).notNull(),
  contacto: varchar('contacto', { length: 100 }),
  is_active: tinyint('is_active').notNull().default(1),
});

/**
 * Tabla: productos
 * Catálogo maestro de productos vendibles y almacenables.
 * Coincide exactamente con WARENGINE_FULL_BD.sql
 */
export const productos = mysqlTable('productos', {
  id_producto: char('id_producto', { length: 36 })
    .notNull()
    .default(sql.raw('(UUID())'))
    .primaryKey(),
  sku: varcharBin('sku', { length: 50 }).notNull(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  categoria_id: int('categoria_id').references(() => categorias.id_categoria, { onDelete: 'restrict' }),
  proveedor_id: int('proveedor_id').references(() => proveedores.id_proveedor, { onDelete: 'restrict' }),
  precio_compra: decimal('precio_compra', { precision: 14, scale: 2 }).notNull(),
  precio_venta: decimal('precio_venta', { precision: 14, scale: 2 }).notNull(),
  precio_corporativo: decimal('precio_corporativo', { precision: 14, scale: 2 }),
  precio_corporativo_actualizado_en: datetime('precio_corporativo_actualizado_en', { mode: 'date' }),
  is_active: tinyint('is_active').notNull().default(1),
}, (table) => [
  uniqueIndex('uq_productos_sku').on(table.sku),
  index('idx_productos_categoria_id').on(table.categoria_id),
  index('idx_productos_proveedor_id').on(table.proveedor_id),
]);

/**
 * Tabla: inventario_sucursal
 * Existencias y niveles de stock por producto en cada sucursal.
 * Coincide exactamente con WARENGINE_FULL_BD.sql
 */
export const inventario_sucursal = mysqlTable('inventario_sucursal', {
  producto_id: char('producto_id', { length: 36 })
    .notNull()
    .references(() => productos.id_producto, { onDelete: 'cascade' }),
  sucursal_id: int('sucursal_id')
    .notNull()
    .references(() => sucursales.id_sucursal, { onDelete: 'restrict' }),
  stock_actual: int('stock_actual').notNull().default(0),
  stock_minimo: int('stock_minimo').notNull().default(0),
}, (table) => [
  primaryKey({ columns: [table.producto_id, table.sucursal_id], name: 'pk_inventario_sucursal' }),
  index('idx_inventario_sucursal_id').on(table.sucursal_id),
  check('chk_inventario_stock_actual', sql`${table.stock_actual} >= 0`),
  check('chk_inventario_stock_minimo', sql`${table.stock_minimo} >= 0`),
]);

/**
 * Tabla: movimientos_inventario
 * Kardex / histórico inmutable (append-only) de entradas, salidas y ajustes.
 * Coincide exactamente con WARENGINE_FULL_BD.sql
 */
export const movimientos_inventario = mysqlTable('movimientos_inventario', {
  id_movimiento_inventario: char('id_movimiento_inventario', { length: 36 })
    .notNull()
    .default(sql.raw('(UUID())'))
    .primaryKey(),
  producto_id: char('producto_id', { length: 36 })
    .notNull()
    .references(() => productos.id_producto, { onDelete: 'restrict' }),
  sucursal_id: int('sucursal_id')
    .notNull()
    .references(() => sucursales.id_sucursal, { onDelete: 'restrict' }),
  tipo: varchar('tipo', { length: 20 }).notNull(),
  cantidad: int('cantidad').notNull(),
  motivo: varchar('motivo', { length: 255 }),
  factura_id: char('factura_id', { length: 36 }),
  proveedor_id: int('proveedor_id').references(() => proveedores.id_proveedor, { onDelete: 'set null' }),
  devolucion_id: char('devolucion_id', { length: 36 }),
  usuario_id: char('usuario_id', { length: 36 })
    .notNull()
    .references(() => usuarios.id_usuario, { onDelete: 'restrict' }),
  fecha: datetime('fecha', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('idx_movimientos_producto_id').on(table.producto_id),
  index('idx_movimientos_sucursal_id').on(table.sucursal_id),
  index('idx_movimientos_factura_id').on(table.factura_id),
  index('idx_movimientos_devolucion_id').on(table.devolucion_id),
  index('idx_movimientos_fecha').on(table.fecha),
  check('chk_movimientos_tipo', sql`${table.tipo} IN ('entrada','salida','ajuste_entrada','ajuste_salida')`),
  check('chk_movimientos_cantidad', sql`${table.cantidad} > 0`),
]);

export type CategoriaRecord = typeof categorias.$inferSelect;
export type NuevaCategoriaRecord = typeof categorias.$inferInsert;

export type ProveedorRecord = typeof proveedores.$inferSelect;
export type NuevoProveedorRecord = typeof proveedores.$inferInsert;

export type ProductoRecord = typeof productos.$inferSelect;
export type NuevoProductoRecord = typeof productos.$inferInsert;

export type InventarioSucursalRecord = typeof inventario_sucursal.$inferSelect;
export type NuevoInventarioSucursalRecord = typeof inventario_sucursal.$inferInsert;

export type MovimientoInventarioRecord = typeof movimientos_inventario.$inferSelect;
export type NuevoMovimientoInventarioRecord = typeof movimientos_inventario.$inferInsert;
