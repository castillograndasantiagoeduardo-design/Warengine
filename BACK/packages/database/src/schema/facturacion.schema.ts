import { sql } from 'drizzle-orm';
import {
    char,
    check,
    datetime,
    mysqlTable,
    tinyint,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/mysql-core';
import { varcharBin } from './column-types.ts';

/**
 * Tabla: clientes
 * Clientes de consumo final (B2C) y corporativos (B2B). Soft delete con deleted_at.
 */
export const clientes = mysqlTable('clientes', {
    id_cliente: char('id_cliente', { length: 36 })
        .notNull()
        .default(sql.raw('(UUID())'))
        .primaryKey(),
    tipo_documento: varchar('tipo_documento', { length: 10 }).notNull(),
    numero_documento: varcharBin('numero_documento', { length: 30 }).notNull(),
    nombre_razon_social: varchar('nombre_razon_social', { length: 200 }).notNull(),
    tipo_cliente: varchar('tipo_cliente', { length: 10 }).notNull().default('B2C'),
    email: varchar('email', { length: 150 }),
    telefono: varchar('telefono', { length: 30 }),
    direccion: varchar('direccion', { length: 255 }),
    credito_habilitado: tinyint('credito_habilitado').notNull().default(0),
    deleted_at: datetime('deleted_at', { mode: 'date' }),
}, (table) => [
    uniqueIndex('uq_clientes_documento').on(table.tipo_documento, table.numero_documento),
    check('chk_clientes_tipo', sql`${table.tipo_cliente} IN ('B2C','B2B')`),
    check('chk_clientes_tipo_documento', sql`${table.tipo_documento} IN ('CC','NIT','RUT')`),
    check(
        'chk_clientes_datos_b2b',
        sql`${table.tipo_cliente} <> 'B2B' OR (${table.direccion} IS NOT NULL AND ${table.telefono} IS NOT NULL)`,
    ),
]);

export type ClienteRecord = typeof clientes.$inferSelect;
export type NuevoClienteRecord = typeof clientes.$inferInsert;