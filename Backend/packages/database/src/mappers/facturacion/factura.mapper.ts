import { DevolucionVenta, EstadoFactura, Factura, FacturaItem, FacturaPago, MedioPago } from '@warengine/core';
import {
    FacturaItemRecord,
    FacturaPagoRecord,
    FacturaRecord,
} from '../../schema/facturacion.schema.ts';

export function facturaItemFromRow(
    row: FacturaItemRecord,
    productoNombre?: string | null,
): FacturaItem {
    return new FacturaItem(
        row.id_factura_item,
        row.factura_id,
        row.producto_id,
        Number(row.cantidad),
        Number(row.precio_unitario),
        Number(row.descuento),
        Number(row.subtotal),
        productoNombre,
    );
}

export function facturaPagoFromRow(row: FacturaPagoRecord): FacturaPago {
    return new FacturaPago(
        row.id_factura_pago,
        row.factura_id,
        row.medio_pago as MedioPago,
        Number(row.monto),
        row.referencia_transaccion,
        row.fecha,
    );
}

export function facturaFromRow(
    row: FacturaRecord,
    items: FacturaItem[] = [],
    pagos: FacturaPago[] = [],
    clienteNombre?: string | null,
    clienteDocumento?: string | null,
    cajeroNombre?: string | null,
    tipoVenta?: 'POS' | 'B2B' | null,
    devoluciones?: DevolucionVenta[],
): Factura {
    return new Factura(
        row.id_factura,
        Number(row.consecutivo),
        row.cliente_id,
        row.usuario_id,
        Number(row.sucursal_id),
        row.turno_caja_id,
        Number(row.subtotal),
        Number(row.iva),
        Number(row.total),
        row.estado as EstadoFactura,
        row.anulada_por,
        row.fecha,
        items,
        pagos,
        clienteNombre,
        clienteDocumento,
        cajeroNombre,
        tipoVenta,
        devoluciones,
    );
}
