import { DevolucionVenta } from '@warengine/core';
import { DevolucionVentaRecord } from '../../schema/facturacion.schema.ts';

export function devolucionVentaFromRow(row: DevolucionVentaRecord): DevolucionVenta {
    return new DevolucionVenta(
        row.id_devolucion_venta, row.factura_id, row.factura_item_id,
        Number(row.cantidad), row.motivo, Number(row.monto_reembolso),
        Number(row.reingresa_stock) === 1, row.usuario_id,
        Number(row.sucursal_id), row.fecha,
    );
}