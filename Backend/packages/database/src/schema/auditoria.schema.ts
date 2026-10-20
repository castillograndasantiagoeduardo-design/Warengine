import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  char,
  datetime,
  index,
  int,
  json,
  mysqlTable,
  text,
  varchar,
} from 'drizzle-orm/mysql-core';
import { usuarios } from './autenticacion.schema.ts';
import { sucursales } from './administracion.schema.ts';

/**
 * Tabla: logs_auditoria
 * Registro de toda operación de creación, edición o inactivación (RNF-ADM-02).
 * La BD no tiene triggers de auditoría (el backend inserta una fila por operación),
 * pero cuenta con triggers de protección (trg_logs_auditoria_bloquea_update / delete)
 * para garantizar su inmutabilidad (solo inserción).
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

/**
 * Tabla: logs_mcp_tools
 * Bitácora forense de auditoría para toda invocación de herramientas del servidor MCP (RF-SA-I9).
 * Registra el nombre de la tool, usuario autenticado, sucursal de contexto, parámetros recibidos,
 * si la ejecución fue exitosa, la latencia en milisegundos y el error si ocurrió un fallo o denegación.
 */
export const logs_mcp_tools = mysqlTable('logs_mcp_tools', {
  id_log_mcp_tool: bigint('id_log_mcp_tool', { mode: 'number', unsigned: true })
    .autoincrement()
    .primaryKey(),
  tool_name: varchar('tool_name', { length: 100 }).notNull(),
  usuario_id: char('usuario_id', { length: 36 })
    .references(() => usuarios.id_usuario, { onDelete: 'set null' }),
  sucursal_id: int('sucursal_id')
    .references(() => sucursales.id_sucursal, { onDelete: 'set null' }),
  parametros: json('parametros'),
  exitoso: boolean('exitoso').notNull().default(true),
  duracion_ms: int('duracion_ms').notNull().default(0),
  error: text('error'),
  fecha: datetime('fecha', { mode: 'date' })
    .notNull()
    .default(sql.raw('CURRENT_TIMESTAMP')),
}, (table) => [
  index('idx_logs_mcp_tool_name').on(table.tool_name),
  index('idx_logs_mcp_usuario_id').on(table.usuario_id),
  index('idx_logs_mcp_fecha').on(table.fecha),
]);

export type LogMcpToolRecord = typeof logs_mcp_tools.$inferSelect;
export type NuevoLogMcpToolRecord = typeof logs_mcp_tools.$inferInsert;