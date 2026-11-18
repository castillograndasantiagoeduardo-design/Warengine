import type { EstadoCotizacionB2B, EstadoPedidoB2B } from '@warengine/contracts';
import { CotizacionB2B, CotizacionB2BItem, type MedioPago } from '@warengine/core';
import type {
  CotizacionB2BItemRecord,
  CotizacionB2BRecord,
} from '../../schema/facturacion.schema.ts';

export interface CotizacionB2BMetadatos {
  clienteNombre?: string | null;
  clienteDocumento?: string | null;
  vendedorEmail?: string | null;
  sucursalNombre?: string | null;
  aprobadoPorEmail?: string | null;
}

export interface CotizacionB2BItemMetadatos {
  productoNombre?: string | null;
  productoSku?: string | null;
  stockBodegaActual?: number | null;
}

export function cotizacionB2BItemFromRow(
  row: CotizacionB2BItemRecord,
  meta?: CotizacionB2BItemMetadatos,
): CotizacionB2BItem {
  return new CotizacionB2BItem(
    row.id_cotizacion_item,
    row.cotizacion_id,
    row.producto_id,
    row.cantidad,
    Number(row.precio_unitario),
    Number(row.descuento),
    Number(row.subtotal),
    meta?.productoNombre ?? null,
    meta?.productoSku ?? null,
    meta?.stockBodegaActual !== undefined ? (meta.stockBodegaActual !== null ? Number(meta.stockBodegaActual) : null) : null,
  );
}

export function cotizacionB2BFromRow(
  row: CotizacionB2BRecord,
  items: CotizacionB2BItem[],
  meta?: CotizacionB2BMetadatos,
): CotizacionB2B {
  return new CotizacionB2B(
    row.id_cotizacion,
    row.consecutivo,
    row.cliente_id,
    row.vendedor_id,
    row.sucursal_id,
    Number(row.subtotal),
    Number(row.iva),
    Number(row.total),
    row.medio_pago_sugerido as MedioPago,
    row.referencia_pago ?? null,
    row.estado as EstadoCotizacionB2B,
    (row.estado_pedido as EstadoPedidoB2B | null) ?? null,
    row.valida_hasta,
    row.observaciones ?? null,
    row.aprobado_por ?? null,
    row.fecha_aval ?? null,
    row.motivo_rechazo ?? null,
    row.factura_id ?? null,
    row.created_at,
    row.updated_at,
    items,
    meta?.clienteNombre ?? null,
    meta?.clienteDocumento ?? null,
    meta?.vendedorEmail ?? null,
    meta?.sucursalNombre ?? null,
    meta?.aprobadoPorEmail ?? null,
  );
}
