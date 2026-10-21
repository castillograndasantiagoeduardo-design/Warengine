import { sql } from 'drizzle-orm';
import {
  char,
  check,
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
import { areas, empleados, sucursales } from './administracion.schema.ts';
import { proveedores } from './inventario.schema.ts';
import { usuarios } from './autenticacion.schema.ts';

/** Familias de activos internos. Independiente de `categorias` (productos vendibles). */
export const categoriasActivos = mysqlTable('categorias_activos', {
  id_categoria_activo: int('id_categoria_activo').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  is_active: tinyint('is_active').notNull().default(1),
});

/** Activos fijos internos. `estado` lo gobiernan los triggers de asignaciones y mantenimientos. */
export const activos = mysqlTable('activos', {
  id_activo: char('id_activo', { length: 36 })
    .notNull()
    .default(sql.raw('(UUID())'))
    .primaryKey(),
  codigo_activo: varcharBin('codigo_activo', { length: 50 }).notNull(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  categoria_activo_id: int('categoria_activo_id').references(
    () => categoriasActivos.id_categoria_activo,
    { onDelete: 'restrict' },
  ),
  sucursal_id: int('sucursal_id')
    .notNull()
    .references(() => sucursales.id_sucursal, { onDelete: 'restrict' }),
  estado: varchar('estado', { length: 20 }).notNull().default('disponible'),
  valor_adquisicion: decimal('valor_adquisicion', { precision: 14, scale: 2 }),
  fecha_adquisicion: date('fecha_adquisicion', { mode: 'string' }),
  condicion: varchar('condicion', { length: 50 }),
  is_active: tinyint('is_active').notNull().default(1),
}, (table) => [
  uniqueIndex('uq_activos_codigo').on(table.codigo_activo),
  index('idx_activos_categoria_activo_id').on(table.categoria_activo_id),
  index('idx_activos_sucursal_id').on(table.sucursal_id),
  check(
    'chk_activos_estado',
    sql`${table.estado} IN ('disponible','asignado','mantenimiento','baja')`,
  ),
]);

/** Custodia de un activo por un empleado O un area (XOR forzado por trigger). */
export const asignacionesActivos = mysqlTable('asignaciones_activos', {
  id_asignacion_activo: char('id_asignacion_activo', { length: 36 })
    .notNull()
    .default(sql.raw('(UUID())'))
    .primaryKey(),
  activo_id: char('activo_id', { length: 36 })
    .notNull()
    .references(() => activos.id_activo, { onDelete: 'restrict' }),
  empleado_id: char('empleado_id', { length: 36 }).references(() => empleados.id_empleado, {
    onDelete: 'set null',
  }),
  area_id: int('area_id').references(() => areas.id_area, { onDelete: 'set null' }),
  sucursal_id: int('sucursal_id')
    .notNull()
    .references(() => sucursales.id_sucursal, { onDelete: 'restrict' }),
  asignado_por: char('asignado_por', { length: 36 })
    .notNull()
    .references(() => usuarios.id_usuario, { onDelete: 'restrict' }),
  fecha_asignacion: datetime('fecha_asignacion', { mode: 'date' })
    .notNull()
    .default(sql.raw('CURRENT_TIMESTAMP')),
  fecha_devolucion_esperada: datetime('fecha_devolucion_esperada', { mode: 'date' }),
  fecha_devolucion_real: datetime('fecha_devolucion_real', { mode: 'date' }),
  estado: varchar('estado', { length: 20 }).notNull().default('activa'),
  observaciones: varchar('observaciones', { length: 500 }),
}, (table) => [
  index('idx_asignaciones_activo_id').on(table.activo_id),
  index('idx_asignaciones_empleado_id').on(table.empleado_id),
  index('idx_asignaciones_area_id').on(table.area_id),
  check('chk_asignaciones_estado', sql`${table.estado} IN ('activa','devuelta','vencida')`),
]);

/** Mientras `fecha_fin` sea NULL el mantenimiento esta en curso (los triggers sincronizan el estado). */
export const mantenimientosActivos = mysqlTable('mantenimientos_activos', {
  id_mantenimiento_activo: char('id_mantenimiento_activo', { length: 36 })
    .notNull()
    .default(sql.raw('(UUID())'))
    .primaryKey(),
  activo_id: char('activo_id', { length: 36 })
    .notNull()
    .references(() => activos.id_activo, { onDelete: 'restrict' }),
  proveedor_id: int('proveedor_id').references(() => proveedores.id_proveedor, {
    onDelete: 'set null',
  }),
  tipo: varchar('tipo', { length: 50 }).notNull(),
  fecha: date('fecha', { mode: 'string' }).notNull().default(sql.raw('(CURDATE())')),
  fecha_fin: date('fecha_fin', { mode: 'string' }),
  costo: decimal('costo', { precision: 14, scale: 2 }),
  descripcion: varchar('descripcion', { length: 500 }),
  deleted_at: datetime('deleted_at', { mode: 'date' }),
}, (table) => [
  index('idx_mantenimientos_activo_id').on(table.activo_id),
  index('idx_mantenimientos_proveedor_id').on(table.proveedor_id),
]);

export type CategoriaActivoRecord = typeof categoriasActivos.$inferSelect;
export type ActivoRecord = typeof activos.$inferSelect;
export type AsignacionActivoRecord = typeof asignacionesActivos.$inferSelect;
export type MantenimientoActivoRecord = typeof mantenimientosActivos.$inferSelect;
