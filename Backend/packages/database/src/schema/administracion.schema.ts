import { sql } from 'drizzle-orm';
import {
  check,
  char,
  date,
  datetime,
  decimal,
  index,
  int,
  mysqlTable,
  tinyint,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import { varcharBin } from './column-types.ts';

/**
 * Tabla: sucursales
 * Representa los puntos físicos de venta y almacenes.
 */
export const sucursales = mysqlTable('sucursales', {
  id_sucursal: int('id_sucursal').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 150 }).notNull(),
  direccion: varchar('direccion', { length: 255 }),
  contacto: varchar('contacto', { length: 100 }),
  is_active: tinyint('is_active').notNull().default(1),
});

/**
 * Tabla: areas
 * Áreas funcionales dentro de una sucursal (Bodega, Caja, Ventas, etc.).
 */
export const areas = mysqlTable('areas', {
  id_area: int('id_area').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  sucursal_id: int('sucursal_id')
    .notNull()
    .references(() => sucursales.id_sucursal, { onDelete: 'restrict' }),
}, (table) => [
  index('idx_areas_sucursal_id').on(table.sucursal_id),
]);

/**
 * Tabla: empleados
 * Registro del personal vinculado contractualmente con Warengine.
 */
export const empleados = mysqlTable('empleados', {
  id_empleado: char('id_empleado', { length: 36 })
    .notNull()
    .default(sql.raw('(UUID())'))
    .primaryKey(),
  tipo_documento: varchar('tipo_documento', { length: 10 }).notNull(),
  numero_documento: varcharBin('numero_documento', { length: 30 }).notNull(),
  nombre: varchar('nombre', { length: 150 }).notNull(),
  telefono: varchar('telefono', { length: 30 }),
  direccion: varchar('direccion', { length: 255 }),
  cargo: varchar('cargo', { length: 100 }),
  area_id: int('area_id').references(() => areas.id_area, { onDelete: 'set null' }),
  sucursal_id: int('sucursal_id')
    .notNull()
    .references(() => sucursales.id_sucursal, { onDelete: 'restrict' }),
  fecha_ingreso: date('fecha_ingreso', { mode: 'string' })
    .notNull()
    .default(sql.raw('(CURDATE())')),
  sueldo_actual: decimal('sueldo_actual', { precision: 14, scale: 2 }),
  is_active: tinyint('is_active').notNull().default(1),
  created_at: datetime('created_at', { mode: 'date' })
    .notNull()
    .default(sql.raw('CURRENT_TIMESTAMP')),
}, (table) => [
  uniqueIndex('uq_empleados_documento').on(table.tipo_documento, table.numero_documento),
  index('idx_empleados_sucursal_id').on(table.sucursal_id),
  index('idx_empleados_area_id').on(table.area_id),
  check('chk_empleados_tipo_documento', sql`${table.tipo_documento} IN ('CC','CE')`),
]);

export type SucursalRecord = typeof sucursales.$inferSelect;
export type AreaRecord = typeof areas.$inferSelect;
export type EmpleadoRecord = typeof empleados.$inferSelect;
export type NuevoEmpleadoRecord = typeof empleados.$inferInsert;
