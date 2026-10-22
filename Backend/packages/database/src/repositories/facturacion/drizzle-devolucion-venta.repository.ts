import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { devoluciones_ventas } from '../../schema/facturacion.schema.ts';
import {
    CantidadDevolucionExcedidaError,
    DevolucionInvalidaError,
    DevolucionVenta,
    FacturaAnuladaError,
    IDevolucionVentaRepository,
    ResumenDevueltoItem,
} from '@warengine/core';
import { devolucionVentaFromRow } from '../../mappers/facturacion/devolucion-venta.mapper.ts';
import { obtenerSqlMessage } from '../../errors/mysql-error-translator.ts';

export class DrizzleDevolucionVentaRepository implements IDevolucionVentaRepository {
    constructor(private readonly db: Database) { }

    public async registrar(devoluciones: DevolucionVenta[]): Promise<DevolucionVenta[]> {
        try {
            return await this.db.transaction(async (tx) => {
                for (const d of devoluciones) {
                    await tx.insert(devoluciones_ventas).values({
                        id_devolucion_venta: d.id,
                        factura_item_id: d.facturaItemId,
                        factura_id: d.facturaId,
                        cantidad: d.cantidad,
                        motivo: d.motivo,
                        monto_reembolso: d.montoReembolso.toFixed(2),
                        reingresa_stock: d.reingresaStock ? 1 : 0,
                        usuario_id: d.usuarioId,
                        sucursal_id: d.sucursalId,
                    });
                }
                const rows = await tx.select().from(devoluciones_ventas)
                    .where(inArray(devoluciones_ventas.id_devolucion_venta, devoluciones.map((d) => d.id)));
                return rows.map(devolucionVentaFromRow);
            });
        } catch (error) {
            const msg = obtenerSqlMessage(error) ?? '';
            if (msg.includes('supera la cantidad vendida')) throw new CantidadDevolucionExcedidaError(msg);
            if (msg.includes('factura anulada')) throw new FacturaAnuladaError();
            if (msg.includes('monto de reembolso supera') || msg.includes('factura distinta') || msg.includes('sucursal de la devolucion')) {
                throw new DevolucionInvalidaError(msg);
            }
            throw error;
        }
    }

    public async resumenDevueltoPorFactura(facturaId: string): Promise<Map<string, ResumenDevueltoItem>> {
        const rows = await this.db
            .select({
                itemId: devoluciones_ventas.factura_item_id,
                cantidad: sql<number>`COALESCE(SUM(${devoluciones_ventas.cantidad}), 0)`,
                monto: sql<string>`COALESCE(SUM(${devoluciones_ventas.monto_reembolso}), 0)`,
            })
            .from(devoluciones_ventas)
            .where(and(eq(devoluciones_ventas.factura_id, facturaId), isNull(devoluciones_ventas.deleted_at)))
            .groupBy(devoluciones_ventas.factura_item_id);
        return new Map(rows.map((r) => [r.itemId, { cantidad: Number(r.cantidad), monto: Number(r.monto) }]));
    }

    public async listarPorFactura(facturaId: string): Promise<DevolucionVenta[]> {
        const rows = await this.db.select().from(devoluciones_ventas)
            .where(and(eq(devoluciones_ventas.factura_id, facturaId), isNull(devoluciones_ventas.deleted_at)))
            .orderBy(asc(devoluciones_ventas.fecha));
        return rows.map(devolucionVentaFromRow);
    }
}