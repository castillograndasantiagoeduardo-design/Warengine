import { sql } from 'drizzle-orm';
import { char, datetime, decimal, index, int, mysqlTable } from 'drizzle-orm/mysql-core';
import { sucursales } from './administracion.schema.ts';
import { usuarios } from './autenticacion.schema.ts';

/**
 * Tabla: turnos_caja
 * Apertura y cierre de caja del cajero. La columna generada
 * `turno_abierto_usuario` (script 002) vive solo en la BD.
 */
export const turnos_caja = mysqlTable('turnos_caja', {
    id_turno_caja: char('id_turno_caja', { length: 36 })
        .notNull()
        .default(sql.raw('(UUID())'))
        .primaryKey(),
    usuario_id: char('usuario_id', { length: 36 })
        .notNull()
        .references(() => usuarios.id_usuario, { onDelete: 'restrict' }),
    sucursal_id: int('sucursal_id')
        .notNull()
        .references(() => sucursales.id_sucursal, { onDelete: 'restrict' }),
    fondo_inicial: decimal('fondo_inicial', { precision: 14, scale: 2 }).notNull(),
    fondo_final: decimal('fondo_final', { precision: 14, scale: 2 }),
    diferencia: decimal('diferencia', { precision: 14, scale: 2 }),
    fecha_apertura: datetime('fecha_apertura', { mode: 'date' })
        .notNull()
        .default(sql.raw('CURRENT_TIMESTAMP')),
    fecha_cierre: datetime('fecha_cierre', { mode: 'date' }),
    deleted_at: datetime('deleted_at', { mode: 'date' }),
}, (table) => [
    index('idx_turnos_caja_usuario_id').on(table.usuario_id),
    index('idx_turnos_caja_sucursal_id').on(table.sucursal_id),
]);

export type TurnoCajaRecord = typeof turnos_caja.$inferSelect;