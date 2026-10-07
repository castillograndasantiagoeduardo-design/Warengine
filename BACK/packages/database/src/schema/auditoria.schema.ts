import { sql } from 'drizzle-orm';
import { char, datetime, index, json, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { usuarios } from './autenticacion.schema.ts';

/**
 * Tabla: logs_auditoria
 * Registro de toda operación de creación, edición o inactivación (RNF-ADM-02).
 * La BD no tiene triggers de auditoría: el backend inserta una fila por operación.
 * Si se borra el usuario, el log se conserva con usuario_id NULL (ON DELETE SET NULL).
 */
export const logs_auditoria = mysqlTable('logs_auditoria', {
  id_log_auditoria: char('id_log_auditoria', { length: 36 })
    .notNull()
    .default(sql.raw('(UUID())'))
    .primaryKey(),
  usuario_id: char('usuario_id', { length: 36 })
    .references(() => usuarios.id_usuario, { onDelete: 'set null' }),
  accion: varchar('accion', { length: 50 }).notNull(),
  entidad: varchar('entidad', { length: 100 }).notNull(),
  entidad_id: varchar('entidad_id', { length: 100 }),
  detalles: json('detalles'),
  ip: varchar('ip', { length: 45 }),
  fecha: datetime('fecha', { mode: 'date' })
    .notNull()
    .default(sql.raw('CURRENT_TIMESTAMP')),
}, (table) => [
  index('idx_logs_auditoria_usuario_id').on(table.usuario_id),
  index('idx_logs_auditoria_fecha').on(table.fecha),
]);

export type LogAuditoriaRecord = typeof logs_auditoria.$inferSelect;