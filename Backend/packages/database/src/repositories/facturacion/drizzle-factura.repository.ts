import { and, desc, eq, gte, inArray, isNotNull, isNull, like, lte, or, sql, type SQL } from 'drizzle-orm';
import { Database } from '../../client.ts';
import {
    clientes,
    devoluciones_ventas,
    factura_items,
    factura_pagos,
    facturas,
} from '../../schema/facturacion.schema.ts';
import { usuarios } from '../../schema/autenticacion.schema.ts';
import { empleados } from '../../schema/administracion.schema.ts';
import { productos } from '../../schema/inventario.schema.ts';
import {
    CrearFacturaDatos,
    CreditoNoHabilitadoError,
    DevolucionVenta,
    Factura,
    FacturaItem,
    FacturaPago,
    FacturasPaginadasResultado,
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
import { devolucionVentaFromRow } from '../../mappers/facturacion/devolucion-venta.mapper.ts';
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

                // Reconstruir en el orden exacto de inserción
                const itemsMap = new Map(itemRows.map((r) => [r.id_factura_item, facturaItemFromRow(r)]));
                const itemsOrdenados = datos.items.map((i) => itemsMap.get(i.id)!).filter(Boolean);

                return facturaFromRow(
                    row,
                    itemsOrdenados,
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
                itemRows.map((r) => facturaItemFromRow(r)),
                pagoRows.map(facturaPagoFromRow),
            );
        });
    }

    public async findById(id: string): Promise<Factura | null> {
        const [row] = await this.db
            .select({
                factura: facturas,
                clienteNombre: clientes.nombre_razon_social,
                clienteDocumento: clientes.numero_documento,
                clienteTipo: clientes.tipo_cliente,
                empleadoNombre: empleados.nombre,
                usuarioEmail: usuarios.email,
            })
            .from(facturas)
            .leftJoin(clientes, eq(facturas.cliente_id, clientes.id_cliente))
            .leftJoin(usuarios, eq(facturas.usuario_id, usuarios.id_usuario))
            .leftJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
            .where(and(eq(facturas.id_factura, id), isNull(facturas.deleted_at)))
            .limit(1);

        if (!row) return null;

        const itemRows = await this.db
            .select({
                item: factura_items,
                productoNombre: productos.nombre,
            })
            .from(factura_items)
            .leftJoin(productos, eq(factura_items.producto_id, productos.id_producto))
            .where(and(eq(factura_items.factura_id, id), isNull(factura_items.deleted_at)));

        const pagoRows = await this.db
            .select()
            .from(factura_pagos)
            .where(eq(factura_pagos.factura_id, id));

        const devolucionRows = await this.db
            .select()
            .from(devoluciones_ventas)
            .where(and(eq(devoluciones_ventas.factura_id, id), isNull(devoluciones_ventas.deleted_at)));

        const cajeroNombre = row.empleadoNombre || row.usuarioEmail || 'Cajero';
        const clienteNombre = (row.clienteDocumento === '222222222222' || !row.clienteNombre) ? 'Consumidor Final' : row.clienteNombre;
        const clienteDocumento = row.clienteDocumento || '222222222222';
        const tipoVenta: 'POS' | 'B2B' = row.factura.turno_caja_id ? 'POS' : (row.clienteTipo === 'B2B' ? 'B2B' : 'POS');

        return facturaFromRow(
            row.factura,
            itemRows.map((r) => facturaItemFromRow(r.item, r.productoNombre)),
            pagoRows.map(facturaPagoFromRow),
            clienteNombre,
            clienteDocumento,
            cajeroNombre,
            tipoVenta,
            devolucionRows.map(devolucionVentaFromRow),
        );
    }

    public async listarPaginado(filtros: FiltrosFacturas): Promise<FacturasPaginadasResultado> {
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
        const fechaInicio = filtros.desde ?? filtros.fechaInicio;
        if (fechaInicio) {
            condiciones.push(gte(facturas.fecha, fechaInicio));
        }
        const fechaFin = filtros.hasta ?? filtros.fechaFin;
        if (fechaFin) {
            condiciones.push(lte(facturas.fecha, fechaFin));
        }

        if (filtros.tipo) {
            if (filtros.tipo.toUpperCase() === 'B2B') {
                condiciones.push(eq(clientes.tipo_cliente, 'B2B'));
            } else if (filtros.tipo.toUpperCase() === 'POS') {
                condiciones.push(or(isNotNull(facturas.turno_caja_id), eq(clientes.tipo_cliente, 'B2C'))!);
            }
        }

        if (filtros.texto && filtros.texto.trim()) {
            const t = filtros.texto.trim();
            const condicionesTexto: SQL[] = [
                like(clientes.nombre_razon_social, `%${t}%`),
                like(clientes.numero_documento, `%${t}%`),
            ];
            const num = Number(t.replace(/[^0-9]/g, ''));
            if (!isNaN(num) && num > 0) {
                condicionesTexto.push(eq(facturas.consecutivo, num));
            }
            condiciones.push(or(...condicionesTexto)!);
        }

        const [countRow] = await this.db
            .select({ total: sql<number>`COUNT(DISTINCT ${facturas.id_factura})` })
            .from(facturas)
            .leftJoin(clientes, eq(facturas.cliente_id, clientes.id_cliente))
            .where(and(...condiciones));

        const total = Number(countRow?.total ?? 0);
        if (total === 0) {
            return { items: [], total: 0 };
        }

        const rows = await this.db
            .select({
                factura: facturas,
                clienteNombre: clientes.nombre_razon_social,
                clienteDocumento: clientes.numero_documento,
                clienteTipo: clientes.tipo_cliente,
                empleadoNombre: empleados.nombre,
                usuarioEmail: usuarios.email,
            })
            .from(facturas)
            .leftJoin(clientes, eq(facturas.cliente_id, clientes.id_cliente))
            .leftJoin(usuarios, eq(facturas.usuario_id, usuarios.id_usuario))
            .leftJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
            .where(and(...condiciones))
            .orderBy(desc(facturas.fecha))
            .limit(filtros.limite)
            .offset(filtros.offset);

        if (rows.length === 0) {
            return { items: [], total };
        }

        const ids = rows.map((r) => r.factura.id_factura);

        const allItems = await this.db
            .select({
                item: factura_items,
                productoNombre: productos.nombre,
            })
            .from(factura_items)
            .leftJoin(productos, eq(factura_items.producto_id, productos.id_producto))
            .where(and(inArray(factura_items.factura_id, ids), isNull(factura_items.deleted_at)));

        const allPagos = await this.db
            .select()
            .from(factura_pagos)
            .where(inArray(factura_pagos.factura_id, ids));

        const allDevoluciones = await this.db
            .select()
            .from(devoluciones_ventas)
            .where(and(inArray(devoluciones_ventas.factura_id, ids), isNull(devoluciones_ventas.deleted_at)));

        const itemsPorFactura = new Map<string, FacturaItem[]>();
        for (const it of allItems) {
            const list = itemsPorFactura.get(it.item.factura_id) ?? [];
            list.push(facturaItemFromRow(it.item, it.productoNombre));
            itemsPorFactura.set(it.item.factura_id, list);
        }

        const pagosPorFactura = new Map<string, FacturaPago[]>();
        for (const pagoRow of allPagos) {
            const list = pagosPorFactura.get(pagoRow.factura_id) ?? [];
            list.push(facturaPagoFromRow(pagoRow));
            pagosPorFactura.set(pagoRow.factura_id, list);
        }

        const devolucionesPorFactura = new Map<string, DevolucionVenta[]>();
        for (const devRow of allDevoluciones) {
            const list = devolucionesPorFactura.get(devRow.factura_id) ?? [];
            list.push(devolucionVentaFromRow(devRow));
            devolucionesPorFactura.set(devRow.factura_id, list);
        }

        const items = rows.map((r) => {
            const cajeroNombre = r.empleadoNombre || r.usuarioEmail || 'Cajero';
            const clienteNombre = (r.clienteDocumento === '222222222222' || !r.clienteNombre) ? 'Consumidor Final' : r.clienteNombre;
            const clienteDocumento = r.clienteDocumento || '222222222222';
            const tipoVenta: 'POS' | 'B2B' = r.factura.turno_caja_id ? 'POS' : (r.clienteTipo === 'B2B' ? 'B2B' : 'POS');

            return facturaFromRow(
                r.factura,
                itemsPorFactura.get(r.factura.id_factura) ?? [],
                pagosPorFactura.get(r.factura.id_factura) ?? [],
                clienteNombre,
                clienteDocumento,
                cajeroNombre,
                tipoVenta,
                devolucionesPorFactura.get(r.factura.id_factura) ?? [],
            );
        });

        return { items, total };
    }

    public async listar(filtros: FiltrosFacturas): Promise<Factura[]> {
        const resultado = await this.listarPaginado(filtros);
        return resultado.items;
    }
}
