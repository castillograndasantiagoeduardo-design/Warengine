import { int, mysqlTable, tinyint, varchar } from 'drizzle-orm/mysql-core';

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

export type CategoriaRecord = typeof categorias.$inferSelect;
export type NuevaCategoriaRecord = typeof categorias.$inferInsert;

export type ProveedorRecord = typeof proveedores.$inferSelect;
export type NuevoProveedorRecord = typeof proveedores.$inferInsert;
