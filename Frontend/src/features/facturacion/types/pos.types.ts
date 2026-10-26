/**
 * pos.types.ts — Tipos y contratos para la terminal Punto de Venta (POS) del Cajero en WarEngine.
 *
 * Principio SOLID:
 * - Single Source of Truth: Reutiliza y mapea fielmente los contratos de `@warengine/contracts`.
 */

import type {
  TurnoCajaDto,
  AbrirTurnoCajaInput,
  CerrarTurnoCajaInput,
  FacturaDto,
  FacturaItemDto,
  FacturaPagoDto,
  ItemFacturaInput,
  PagoFacturaInput,
  MedioPago,
  ClienteDto,
  CrearClienteInput,
} from '@warengine/contracts';

// Re-exportar contratos base
export type {
  TurnoCajaDto,
  AbrirTurnoCajaInput,
  CerrarTurnoCajaInput,
  FacturaDto,
  FacturaItemDto,
  FacturaPagoDto,
  ItemFacturaInput,
  PagoFacturaInput,
  MedioPago,
  ClienteDto,
  CrearClienteInput,
};

/**
 * Producto disponible para venta en el terminal POS.
 */
export interface ProductoPos {
  id: string;
  sku: string;
  nombre: string;
  precioVenta: number;
  precioCorporativo?: number;
  categoriaId?: string | null;
  categoriaNombre?: string | null;
  stockActual: number;
  activo: boolean;
}

/**
 * Ítem presente en el carrito de compras de la venta en curso.
 */
export interface ItemCarritoPos {
  productoId: string;
  sku: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  stockDisponible: number;
  descuento: number;
  subtotal: number;
}

/**
 * Configuración de medio de pago para liquidación.
 */
export interface PagoRegistroPos {
  medioPago: MedioPago;
  monto: number;
  referenciaTransaccion?: string | null;
}

/**
 * Resumen financiero de la orden de venta activa.
 */
export interface ResumenVentaPos {
  subtotal: number;
  iva: number;
  total: number;
  recibidoEfectivo: number;
  cambio: number;
  totalPagado: number;
  faltante: number;
  estaPagadoCompleto: boolean;
}

/**
 * Resumen de caja del turno actual del cajero.
 */
export interface TurnoActivoInfo {
  turno: TurnoCajaDto | null;
  totalVendido: number;
  ventasEfectivo: number;
  cantidadFacturas: number;
}
