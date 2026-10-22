import { sql } from 'drizzle-orm';
import {
    char,
    check,
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
import { sucursales } from './administracion.schema.ts';
import { usuarios } from './autenticacion.schema.ts';
import { turnos_caja } from './turnos-caja.schema.ts';
import { productos } from './inventario.schema.ts';

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

/**
 * Tabla: facturas
 * Cabecera de venta/facturación por sucursal. Soft delete con deleted_at.
 */
export const facturas = mysqlTable('facturas', {
    id_factura: char('id_factura', { length: 36 })
        .notNull()
        .default(sql.raw('(UUID())'))
        .primaryKey(),
    consecutivo: int('consecutivo').notNull(),
    cliente_id: char('cliente_id', { length: 36 })
        .notNull()
        .references(() => clientes.id_cliente, { onDelete: 'restrict' }),
    usuario_id: char('usuario_id', { length: 36 })
        .notNull()
        .references(() => usuarios.id_usuario, { onDelete: 'restrict' }),
    sucursal_id: int('sucursal_id')
        .notNull()
        .references(() => sucursales.id_sucursal, { onDelete: 'restrict' }),
    turno_caja_id: char('turno_caja_id', { length: 36 })
        .references(() => turnos_caja.id_turno_caja, { onDelete: 'restrict' }),
    subtotal: decimal('subtotal', { precision: 14, scale: 2 }).notNull(),
    iva: decimal('iva', { precision: 14, scale: 2 }).notNull().default('0.00'),
    total: decimal('total', { precision: 14, scale: 2 }).notNull(),
    estado: varchar('estado', { length: 20 }).notNull().default('emitida'),
    anulada_por: char('anulada_por', { length: 36 })
        .references(() => usuarios.id_usuario, { onDelete: 'restrict' }),
    fecha: datetime('fecha', { mode: 'date' })
        .notNull()
        .default(sql.raw('CURRENT_TIMESTAMP')),
    deleted_at: datetime('deleted_at', { mode: 'date' }),
}, (table) => [
    uniqueIndex('uq_facturas_consecutivo_sucursal').on(table.sucursal_id, table.consecutivo),
    index('idx_facturas_cliente_id').on(table.cliente_id),
    index('idx_facturas_usuario_id').on(table.usuario_id),
    index('idx_facturas_fecha').on(table.fecha),
    index('idx_facturas_anulada_por').on(table.anulada_por),
    check('chk_facturas_estado', sql`${table.estado} IN ('emitida','anulada')`),
]);

export type FacturaRecord = typeof facturas.$inferSelect;
export type NuevaFacturaRecord = typeof facturas.$inferInsert;

/**
 * Tabla: factura_items
 * Renglones de detalle de cada factura.
 */
export const factura_items = mysqlTable('factura_items', {
    id_factura_item: char('id_factura_item', { length: 36 })
        .notNull()
        .default(sql.raw('(UUID())'))
        .primaryKey(),
    factura_id: char('factura_id', { length: 36 })
        .notNull()
        .references(() => facturas.id_factura, { onDelete: 'restrict' }),
    producto_id: char('producto_id', { length: 36 })
        .notNull()
        .references(() => productos.id_producto, { onDelete: 'restrict' }),
    cantidad: int('cantidad').notNull(),
    precio_unitario: decimal('precio_unitario', { precision: 14, scale: 2 }).notNull(),
    descuento: decimal('descuento', { precision: 14, scale: 2 }).notNull().default('0.00'),
    subtotal: decimal('subtotal', { precision: 14, scale: 2 }).notNull(),
    deleted_at: datetime('deleted_at', { mode: 'date' }),
}, (table) => [
    index('idx_factura_items_factura_id').on(table.factura_id),
    index('idx_factura_items_producto_id').on(table.producto_id),
    check('chk_facturaitems_cantidad', sql`${table.cantidad} > 0`),
]);

export type FacturaItemRecord = typeof factura_items.$inferSelect;
export type NuevoFacturaItemRecord = typeof factura_items.$inferInsert;

/**
 * Tabla: factura_pagos
 * Medios de pago aplicados a cada factura emitida.
 */
export const factura_pagos = mysqlTable('factura_pagos', {
    id_factura_pago: char('id_factura_pago', { length: 36 })
        .notNull()
        .default(sql.raw('(UUID())'))
        .primaryKey(),
    factura_id: char('factura_id', { length: 36 })
        .notNull()
        .references(() => facturas.id_factura, { onDelete: 'restrict' }),
    medio_pago: varchar('medio_pago', { length: 30 }).notNull(),
    monto: decimal('monto', { precision: 14, scale: 2 }).notNull(),
    referencia_transaccion: varchar('referencia_transaccion', { length: 100 }),
    fecha: datetime('fecha', { mode: 'date' })
        .notNull()
        .default(sql.raw('CURRENT_TIMESTAMP')),
}, (table) => [
    index('idx_factura_pagos_factura_id').on(table.factura_id),
    check('chk_facturapagos_medio', sql`${table.medio_pago} IN ('efectivo','tarjeta','transferencia','credito_corporativo')`),
    check('chk_facturapagos_monto', sql`${table.monto} > 0`),
]);

export type FacturaPagoRecord = typeof factura_pagos.$inferSelect;
export type NuevoFacturaPagoRecord = typeof factura_pagos.$inferInsert;

/**
 * Tabla: devoluciones_ventas
 * Una fila por línea de factura devuelta. Reingreso a kardex por trigger.
 */
export const devoluciones_ventas = mysqlTable('devoluciones_ventas', {
    id_devolucion_venta: char('id_devolucion_venta', { length: 36 })
        .notNull().default(sql.raw('(UUID())')).primaryKey(),
    factura_item_id: char('factura_item_id', { length: 36 })
        .notNull().references(() => factura_items.id_factura_item, { onDelete: 'restrict' }),
    factura_id: char('factura_id', { length: 36 })
        .notNull().references(() => facturas.id_factura, { onDelete: 'restrict' }),
    cantidad: int('cantidad').notNull(),
    motivo: varchar('motivo', { length: 255 }).notNull(),
    monto_reembolso: decimal('monto_reembolso', { precision: 14, scale: 2 }).notNull(),
    reingresa_stock: tinyint('reingresa_stock').notNull().default(1),
    usuario_id: char('usuario_id', { length: 36 })
        .notNull().references(() => usuarios.id_usuario, { onDelete: 'restrict' }),
    sucursal_id: int('sucursal_id')
        .notNull().references(() => sucursales.id_sucursal, { onDelete: 'restrict' }),
    fecha: datetime('fecha', { mode: 'date' }).notNull().default(sql.raw('CURRENT_TIMESTAMP')),
    deleted_at: datetime('deleted_at', { mode: 'date' }),
}, (table) => [
    index('idx_devoluciones_factura_item_id').on(table.factura_item_id),
    index('idx_devoluciones_factura_id').on(table.factura_id),
    check('chk_devoluciones_cantidad', sql`${table.cantidad} > 0`),
]);

export type DevolucionVentaRecord = typeof devoluciones_ventas.$inferSelect;
export type NuevaDevolucionVentaRecord = typeof devoluciones_ventas.$inferInsert;
