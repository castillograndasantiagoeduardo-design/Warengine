import { and, desc, eq, gte, inArray, isNull, lte, sql, type SQL } from 'drizzle-orm';
import { Database } from '../../client.ts';
import {
    factura_items,
    factura_pagos,
    facturas,
} from '../../schema/facturacion.schema.ts';
import {
    CrearFacturaDatos,
    CreditoNoHabilitadoError,
    Factura,
    FacturaItem,
    FacturaPago,
    FiltrosFacturas,
    IFacturaRepository,
    PagoInvalidoError,
    StockInsuficienteError,
} from '@warengine/core';
import {
    facturaFromRow,
    facturaItemFromRow,
    facturaPagoFromRow,
} from '../../mappers/facturacion/factura.mapper.ts';
import { obtenerSqlMessage } from '../../errors/mysql-error-translator.ts';

export class DrizzleFacturaRepository implements IFacturaRepository {
    constructor(private readonly db: Database) { }

    public async obtenerSiguienteConsecutivo(sucursalId: number): Promise<number> {
        const [row] = await this.db
            .select({ maxConsecutivo: sql<number>`COALESCE(MAX(${facturas.consecutivo}), 0)` })
            .from(facturas)
            .where(eq(facturas.sucursal_id, sucursalId));
        return Number(row?.maxConsecutivo ?? 0) + 1;
    }

    public async crear(datos: CrearFacturaDatos): Promise<Factura> {
        try {
            return await this.db.transaction(async (tx) => {
                const [maxRow] = await tx
                    .select({ maxConsecutivo: sql<number>`COALESCE(MAX(${facturas.consecutivo}), 0)` })
                    .from(facturas)
                    .where(eq(facturas.sucursal_id, datos.factura.sucursalId));
                const consecutivo = Number(maxRow?.maxConsecutivo ?? 0) + 1;

                await tx.insert(facturas).values({
                    id_factura: datos.factura.id,
                    consecutivo,
                    cliente_id: datos.factura.clienteId,
                    usuario_id: datos.factura.usuarioId,
                    sucursal_id: datos.factura.sucursalId,
                    turno_caja_id: datos.factura.turnoCajaId,
                    subtotal: datos.factura.subtotal.toFixed(2),
                    iva: datos.factura.iva.toFixed(2),
                    total: datos.factura.total.toFixed(2),
                    estado: datos.factura.estado,
                    anulada_por: datos.factura.anuladaPor,
                });

                for (const item of datos.items) {
                    await tx.insert(factura_items).values({
                        id_factura_item: item.id,
                        factura_id: datos.factura.id,
                        producto_id: item.productoId,
                        cantidad: item.cantidad,
                        precio_unitario: item.precioUnitario.toFixed(2),
                        descuento: item.descuento.toFixed(2),
                        subtotal: item.subtotal.toFixed(2),
                    });
                }

                for (const pago of datos.pagos) {
                    await tx.insert(factura_pagos).values({
                        id_factura_pago: pago.id,
                        factura_id: datos.factura.id,
                        medio_pago: pago.medioPago,
                        monto: pago.monto.toFixed(2),
                        referencia_transaccion: pago.referenciaTransaccion,
                    });
                }

                // Leemos los registros insertados dentro de la transacción
                const [row] = await tx
                    .select()
                    .from(facturas)
                    .where(eq(facturas.id_factura, datos.factura.id))
                    .limit(1);

                const itemRows = await tx
                    .select()
                    .from(factura_items)
                    .where(eq(factura_items.factura_id, datos.factura.id));

                const pagoRows = await tx
                    .select()
                    .from(factura_pagos)
                    .where(eq(factura_pagos.factura_id, datos.factura.id));

                return facturaFromRow(
                    row,
                    itemRows.map(facturaItemFromRow),
                    pagoRows.map(facturaPagoFromRow),
                );
            });
        } catch (error) {
            const sqlMsg = obtenerSqlMessage(error) ?? '';
            if (sqlMsg.includes('Stock insuficiente')) {
                throw new StockInsuficienteError(sqlMsg);
            }
            if (sqlMsg.includes('credito corporativo solo esta disponible')) {
                throw new CreditoNoHabilitadoError();
            }
            if (sqlMsg.includes('suma de los pagos supera el total')) {
                throw new PagoInvalidoError(sqlMsg);
            }
            throw error;
        }
    }

    public async anular(id: string, anuladaPor: string): Promise<Factura | null> {
        return await this.db.transaction(async (tx) => {
            // El filtro estado = 'emitida' hace la anulación idempotente ante concurrencia.
            // Al actualizar, MySQL dispara trg_facturas_anula_reingresa_stock (reingreso al kardex).
            const [resultado] = await tx
                .update(facturas)
                .set({ estado: 'anulada', anulada_por: anuladaPor })
                .where(
                    and(
                        eq(facturas.id_factura, id),
                        eq(facturas.estado, 'emitida'),
                        isNull(facturas.deleted_at),
                    ),
                );

            if (Number(resultado.affectedRows) === 0) {
                return null;
            }

            const [row] = await tx
                .select()
                .from(facturas)
                .where(eq(facturas.id_factura, id))
                .limit(1);

            const itemRows = await tx
                .select()
                .from(factura_items)
                .where(and(eq(factura_items.factura_id, id), isNull(factura_items.deleted_at)));

            const pagoRows = await tx
                .select()
                .from(factura_pagos)
                .where(eq(factura_pagos.factura_id, id));

            return facturaFromRow(
                row,
                itemRows.map(facturaItemFromRow),
                pagoRows.map(facturaPagoFromRow),
            );
        });
    }

    public async findById(id: string): Promise<Factura | null> {
        const [row] = await this.db
            .select()
            .from(facturas)
            .where(and(eq(facturas.id_factura, id), isNull(facturas.deleted_at)))
            .limit(1);

        if (!row) return null;

        const itemRows = await this.db
            .select()
            .from(factura_items)
            .where(and(eq(factura_items.factura_id, id), isNull(factura_items.deleted_at)));

        const pagoRows = await this.db
            .select()
            .from(factura_pagos)
            .where(eq(factura_pagos.factura_id, id));

        return facturaFromRow(
            row,
            itemRows.map(facturaItemFromRow),
            pagoRows.map(facturaPagoFromRow),
        );
    }

    public async listar(filtros: FiltrosFacturas): Promise<Factura[]> {
        const condiciones: SQL[] = [isNull(facturas.deleted_at)];

        if (filtros.sucursalId !== undefined) {
            condiciones.push(eq(facturas.sucursal_id, filtros.sucursalId));
        }
        if (filtros.clienteId) {
            condiciones.push(eq(facturas.cliente_id, filtros.clienteId));
        }
        if (filtros.usuarioId) {
            condiciones.push(eq(facturas.usuario_id, filtros.usuarioId));
        }
        if (filtros.estado) {
            condiciones.push(eq(facturas.estado, filtros.estado));
        }
        if (filtros.fechaInicio) {
            condiciones.push(gte(facturas.fecha, filtros.fechaInicio));
        }
        if (filtros.fechaFin) {
            condiciones.push(lte(facturas.fecha, filtros.fechaFin));
        }

        const rows = await this.db
            .select()
            .from(facturas)
            .where(and(...condiciones))
            .orderBy(desc(facturas.fecha))
            .limit(filtros.limite)
            .offset(filtros.offset);

        if (rows.length === 0) return [];

        const ids = rows.map((r) => r.id_factura);

        const allItems = await this.db
            .select()
            .from(factura_items)
            .where(and(inArray(factura_items.factura_id, ids), isNull(factura_items.deleted_at)));

        const allPagos = await this.db
            .select()
            .from(factura_pagos)
            .where(inArray(factura_pagos.factura_id, ids));

        const itemsPorFactura = new Map<string, FacturaItem[]>();
        for (const itemRow of allItems) {
            const list = itemsPorFactura.get(itemRow.factura_id) ?? [];
            list.push(facturaItemFromRow(itemRow));
            itemsPorFactura.set(itemRow.factura_id, list);
        }

        const pagosPorFactura = new Map<string, FacturaPago[]>();
        for (const pagoRow of allPagos) {
            const list = pagosPorFactura.get(pagoRow.factura_id) ?? [];
            list.push(facturaPagoFromRow(pagoRow));
            pagosPorFactura.set(pagoRow.factura_id, list);
        }

        return rows.map((r) =>
            facturaFromRow(
                r,
                itemsPorFactura.get(r.id_factura) ?? [],
                pagosPorFactura.get(r.id_factura) ?? [],
            ),
        );
    }
}
