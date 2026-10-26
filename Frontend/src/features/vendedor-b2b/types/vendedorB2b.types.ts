/**
 * vendedorB2b.types.ts — Definiciones de tipos para el módulo de Vendedor B2B.
 *
 * Utiliza los contratos base de @warengine/contracts para garantizar
 * coherencia con el backend.
 */

import type {
  ClienteDto,
  CrearClienteInput,
  FacturaDto,
  MedioPago,
  ProductoResponse,
} from '@warengine/contracts';

export type { ClienteDto, CrearClienteInput, FacturaDto, MedioPago, ProductoResponse };

export interface ItemCotizacionB2B {
  productoId: string;
  sku: string;
  nombre: string;
  precioUnitario: number;
  precioVentaOriginal: number;
  esPrecioCorporativo: boolean;
  cantidad: number;
  descuento: number;
  subtotal: number;
  stockDisponible?: number;
}

export interface FiltrosCatalogoB2B {
  texto: string;
  categoriaId: number | null;
  disponibilidad: 'todos' | 'con_stock' | 'stock_bajo';
}

export interface CrearOrdenB2BPayload {
  clienteId: string;
  items: Array<{
    productoId: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
  }>;
  pagos: Array<{
    medioPago: MedioPago;
    monto: number;
    referenciaTransaccion?: string | null;
  }>;
  esB2B: boolean;
}
