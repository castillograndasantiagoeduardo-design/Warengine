import { sql } from 'drizzle-orm';
import {
  char,
  datetime,
  index,
  int,
  mysqlTable,
  primaryKey,
  tinyint,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import { varcharBin } from './column-types.ts';
import { empleados, sucursales } from './administracion.schema.ts';

/**
 * Tabla: roles
 * Define los roles del sistema (super-admin, admin-sucursal, cajero-vendedor).
 */
export const roles = mysqlTable('roles', {
  id_rol: int('id_rol').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 50 }).notNull(),
  descripcion: varchar('descripcion', { length: 255 }),
}, (table) => [
  uniqueIndex('uq_roles_nombre').on(table.nombre),
]);

/**
 * Tabla: permisos
 * Catálogo granular de capacidades del sistema (formato modulo:accion).
 * `codigo` usa COLLATE utf8mb4_bin para comparación binaria exacta.
 */
export const permisos = mysqlTable('permisos', {
  id_permiso: int('id_permiso').autoincrement().primaryKey(),
  codigo: varcharBin('codigo', { length: 100 }).notNull(),
  modulo: varchar('modulo', { length: 50 }).notNull(),
  descripcion: varchar('descripcion', { length: 255 }),
}, (table) => [
  uniqueIndex('uq_permisos_codigo').on(table.codigo),
]);

/**
 * Tabla: rol_permisos
 * Tabla intermedia que asocia permisos a cada rol (RBAC).
 */
export const rol_permisos = mysqlTable('rol_permisos', {
  rol_id: int('rol_id')
    .notNull()
    .references(() => roles.id_rol, { onDelete: 'cascade' }),
  permiso_id: int('permiso_id')
    .notNull()
    .references(() => permisos.id_permiso, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.rol_id, table.permiso_id], name: 'pk_rol_permisos' }),
]);

/**
 * Tabla: usuarios
 * Cuentas de acceso al sistema ligadas a un empleado.
 */
export const usuarios = mysqlTable('usuarios', {
  id_usuario: char('id_usuario', { length: 36 })
    .notNull()
    .default(sql.raw('(UUID())'))
    .primaryKey(),
  empleado_id: char('empleado_id', { length: 36 })
    .notNull()
    .references(() => empleados.id_empleado, { onDelete: 'restrict' }),
  email: varchar('email', { length: 150 }).notNull(),
  password_hash: varcharBin('password_hash', { length: 255 }).notNull(),
  rol_id: int('rol_id')
    .notNull()
    .references(() => roles.id_rol, { onDelete: 'restrict' }),
  is_active: tinyint('is_active').notNull().default(1),
  requiere_2fa: tinyint('requiere_2fa').notNull().default(0),
  totp_secret: varcharBin('totp_secret', { length: 255 }),
  tokens_invalidados_en: datetime('tokens_invalidados_en', { mode: 'date' }),
  created_at: datetime('created_at', { mode: 'date' })
    .notNull()
    .default(sql.raw('CURRENT_TIMESTAMP')),
}, (table) => [
  uniqueIndex('uq_usuarios_empleado_id').on(table.empleado_id),
  uniqueIndex('uq_usuarios_email').on(table.email),
  index('idx_usuarios_rol_id').on(table.rol_id),
]);

/**
 * Tabla: usuario_sucursales
 * Relación N:N que asigna sucursales autorizadas a cada usuario.
 */
export const usuario_sucursales = mysqlTable('usuario_sucursales', {
  usuario_id: char('usuario_id', { length: 36 })
    .notNull()
    .references(() => usuarios.id_usuario, { onDelete: 'cascade' }),
  sucursal_id: int('sucursal_id')
    .notNull()
    .references(() => sucursales.id_sucursal, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.usuario_id, table.sucursal_id], name: 'pk_usuario_sucursales' }),
]);

/**
 * Tabla: refresh_tokens
 * Tokens criptográficos para renovación de sesión.
 */
export const refresh_tokens = mysqlTable('refresh_tokens', {
  id_refresh_token: char('id_refresh_token', { length: 36 })
    .notNull()
    .default(sql.raw('(UUID())'))
    .primaryKey(),
  usuario_id: char('usuario_id', { length: 36 })
    .notNull()
    .references(() => usuarios.id_usuario, { onDelete: 'cascade' }),
  token_hash: varcharBin('token_hash', { length: 255 }).notNull(),
  expira_en: datetime('expira_en', { mode: 'date' }).notNull(),
  revocado: tinyint('revocado').notNull().default(0),
}, (table) => [
  index('idx_refresh_tokens_usuario_id').on(table.usuario_id),
]);

/**
 * Tabla: password_reset_tokens
 * Tokens de un solo uso para recuperación de contraseña olvidada.
 */
export const password_reset_tokens = mysqlTable('password_reset_tokens', {
  id_password_reset_token: char('id_password_reset_token', { length: 36 })
    .notNull()
    .default(sql.raw('(UUID())'))
    .primaryKey(),
  usuario_id: char('usuario_id', { length: 36 })
    .notNull()
    .references(() => usuarios.id_usuario, { onDelete: 'cascade' }),
  token_hash: varcharBin('token_hash', { length: 255 }).notNull(),
  expira_en: datetime('expira_en', { mode: 'date' }).notNull(),
  usado: tinyint('usado').notNull().default(0),
}, (table) => [
  index('idx_password_reset_usuario_id').on(table.usuario_id),
]);

/**
 * Tabla: intentos_login
 * Auditoría de intentos de acceso para control de fuerza bruta y rate-limiting.
 * Sin FK intencionalmente para registrar intentos con correos inexistentes.
 */
export const intentos_login = mysqlTable('intentos_login', {
  id_intento_login: char('id_intento_login', { length: 36 })
    .notNull()
    .default(sql.raw('(UUID())'))
    .primaryKey(),
  email: varchar('email', { length: 150 }).notNull(),
  ip: varchar('ip', { length: 45 }).notNull(),
  exitoso: tinyint('exitoso').notNull(),
  fecha: datetime('fecha', { mode: 'date' })
    .notNull()
    .default(sql.raw('CURRENT_TIMESTAMP')),
}, (table) => [
  index('idx_intentos_login_email').on(table.email),
  index('idx_intentos_login_ip').on(table.ip),
]);

export type RolRecord = typeof roles.$inferSelect;
export type NuevoRolRecord = typeof roles.$inferInsert;
export type PermisoRecord = typeof permisos.$inferSelect;
export type NuevoPermisoRecord = typeof permisos.$inferInsert;
export type RolPermisoRecord = typeof rol_permisos.$inferSelect;
export type UsuarioRecord = typeof usuarios.$inferSelect;
export type NuevoUsuarioRecord = typeof usuarios.$inferInsert;
export type UsuarioSucursalRecord = typeof usuario_sucursales.$inferSelect;
export type RefreshTokenRecord = typeof refresh_tokens.$inferSelect;
export type NuevoRefreshTokenRecord = typeof refresh_tokens.$inferInsert;
export type PasswordResetTokenRecord = typeof password_reset_tokens.$inferSelect;
export type NuevoPasswordResetTokenRecord = typeof password_reset_tokens.$inferInsert;
export type IntentoLoginRecord = typeof intentos_login.$inferSelect;
export type NuevoIntentoLoginRecord = typeof intentos_login.$inferInsert;
