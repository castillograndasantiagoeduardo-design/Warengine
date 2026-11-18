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
    public readonly stockBodegaActual: number | null = null,
  ) {}

  public get tieneStockSuficiente(): boolean {
    if (this.stockBodegaActual === null || this.stockBodegaActual === undefined) {
      return true;
    }
    return this.stockBodegaActual >= this.cantidad;
  }

  public toJSON() {
    return {
      id: this.id,
      cotizacionId: this.cotizacionId,
      productoId: this.productoId,
      cantidad: this.cantidad,
      precioUnitario: this.precioUnitario,
      descuento: this.descuento,
      subtotal: this.subtotal,
      productoNombre: this.productoNombre,
      productoSku: this.productoSku,
      stockBodegaActual: this.stockBodegaActual,
      tieneStockSuficiente: this.tieneStockSuficiente,
    };
  }

  public static crear(
    id: string,
    cotizacionId: string,
    productoId: string,
    cantidad: number,
    precioUnitario: number,
    descuento: number = 0,
    productoNombre: string | null = null,
    productoSku: string | null = null,
    stockBodegaActual: number | null = null,
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
      productoNombre,
      productoSku,
      stockBodegaActual,
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

  public get tieneStockSuficiente(): boolean {
    return this.items.every((i) => i.tieneStockSuficiente);
  }

  public get itemsSinStock(): CotizacionB2BItem[] {
    return this.items.filter((i) => !i.tieneStockSuficiente);
  }

  public puedeRecibirAval(ahora: Date = new Date()): boolean {
    return this.estado === 'pendiente_aval' && !this.estaVencida(ahora) && this.tieneStockSuficiente;
  }

  public puedeFacturarse(ahora: Date = new Date()): boolean {
    return this.estado === 'aprobada' && !this.estaVencida(ahora) && this.facturaId === null;
  }

  public toJSON() {
    return {
      id: this.id,
      consecutivo: this.consecutivo,
      clienteId: this.clienteId,
      vendedorId: this.vendedorId,
      sucursalId: this.sucursalId,
      subtotal: this.subtotal,
      iva: this.iva,
      total: this.total,
      medioPagoSugerido: this.medioPagoSugerido,
      referenciaPago: this.referenciaPago,
      estado: this.estado,
      estadoPedido: this.estadoPedido,
      validaHasta: this.validaHasta instanceof Date ? this.validaHasta.toISOString() : this.validaHasta,
      observaciones: this.observaciones,
      aprobadoPor: this.aprobadoPor,
      fechaAval: this.fechaAval instanceof Date ? this.fechaAval.toISOString() : (this.fechaAval ?? null),
      motivoRechazo: this.motivoRechazo,
      facturaId: this.facturaId,
      createdAt: this.createdAt instanceof Date ? this.createdAt.toISOString() : this.createdAt,
      updatedAt: this.updatedAt instanceof Date ? this.updatedAt.toISOString() : this.updatedAt,
      items: this.items.map((i) => (typeof i.toJSON === 'function' ? i.toJSON() : i)),
      clienteNombre: this.clienteNombre,
      clienteDocumento: this.clienteDocumento,
      vendedorEmail: this.vendedorEmail,
      sucursalNombre: this.sucursalNombre,
      aprobadoPorEmail: this.aprobadoPorEmail,
      tieneStockSuficiente: this.tieneStockSuficiente,
      itemsSinStockCount: this.itemsSinStock.length,
    };
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
