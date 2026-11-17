import type { EstadoCotizacionB2B, EstadoPedidoB2B } from '@warengine/contracts';
import type { MedioPago } from './FacturaPago.ts';
import { Factura } from './Factura.ts';

export class CotizacionB2BItem {
  constructor(
    public readonly id: string,
    public readonly cotizacionId: string,
    public readonly productoId: string,
    public readonly cantidad: number,
    public readonly precioUnitario: number,
    public readonly descuento: number,
    public readonly subtotal: number,
    public readonly productoNombre: string | null = null,
    public readonly productoSku: string | null = null,
  ) {}

  public static crear(
    id: string,
    cotizacionId: string,
    productoId: string,
    cantidad: number,
    precioUnitario: number,
    descuento: number = 0,
  ): CotizacionB2BItem {
    const subtotal = Math.max(0, Math.round((cantidad * precioUnitario - descuento) * 100) / 100);
    return new CotizacionB2BItem(
      id,
      cotizacionId,
      productoId,
      cantidad,
      precioUnitario,
      descuento,
      subtotal,
    );
  }
}

export class CotizacionB2B {
  constructor(
    public readonly id: string,
    public readonly consecutivo: number,
    public readonly clienteId: string,
    public readonly vendedorId: string,
    public readonly sucursalId: number,
    public readonly subtotal: number,
    public readonly iva: number,
    public readonly total: number,
    public readonly medioPagoSugerido: MedioPago,
    public readonly referenciaPago: string | null,
    public readonly estado: EstadoCotizacionB2B,
    public readonly estadoPedido: EstadoPedidoB2B | null,
    public readonly validaHasta: Date,
    public readonly observaciones: string | null,
    public readonly aprobadoPor: string | null,
    public readonly fechaAval: Date | null,
    public readonly motivoRechazo: string | null,
    public readonly facturaId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly items: CotizacionB2BItem[] = [],
    public readonly clienteNombre: string | null = null,
    public readonly clienteDocumento: string | null = null,
    public readonly vendedorEmail: string | null = null,
    public readonly sucursalNombre: string | null = null,
    public readonly aprobadoPorEmail: string | null = null,
  ) {}

  public estaVencida(ahora: Date = new Date()): boolean {
    return ahora > this.validaHasta;
  }

  public puedeRecibirAval(ahora: Date = new Date()): boolean {
    return this.estado === 'pendiente_aval' && !this.estaVencida(ahora);
  }

  public puedeFacturarse(ahora: Date = new Date()): boolean {
    return this.estado === 'aprobada' && !this.estaVencida(ahora) && this.facturaId === null;
  }

  /** Reutiliza exactamente el mismo cálculo de totales que `Factura.calcularTotales` (sin desfases al facturar). */
  public static calcularTotales(
    items: ReadonlyArray<{ cantidad: number; precioUnitario: number; descuento?: number }>,
  ): { subtotal: number; iva: number; total: number } {
    return Factura.calcularTotales(
      items.map((item) => ({
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        descuento: item.descuento ?? 0,
      })),
    );
  }
}
