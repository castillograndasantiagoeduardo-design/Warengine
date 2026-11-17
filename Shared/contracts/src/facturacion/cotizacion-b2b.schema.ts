import { z } from 'zod';
import { MEDIOS_PAGO } from './factura.schema.ts';

export const ESTADOS_COTIZACION_B2B = [
  'borrador',
  'pendiente_aval',
  'aprobada',
  'rechazada',
  'facturada',
  'vencida',
] as const;

export const ESTADOS_PEDIDO_B2B = [
  'en_proceso',
  'despachado',
  'entregado',
  'cancelado',
] as const;

export type EstadoCotizacionB2B = (typeof ESTADOS_COTIZACION_B2B)[number];
export type EstadoPedidoB2B = (typeof ESTADOS_PEDIDO_B2B)[number];

export const itemCotizacionB2BSchema = z.object({
  productoId: z.string().uuid({ message: 'El ID del producto debe ser un UUID válido.' }),
  cantidad: z.number().int().positive({ message: 'La cantidad debe ser un entero positivo.' }),
  precioUnitario: z.number().nonnegative({ message: 'El precio unitario no puede ser negativo.' }),
  descuento: z.number().nonnegative({ message: 'El descuento no puede ser negativo.' }).default(0),
});

export const crearCotizacionB2BSchema = z.object({
  clienteId: z.string().uuid({ message: 'El ID del cliente B2B debe ser un UUID válido.' }),
  medioPagoSugerido: z.enum(MEDIOS_PAGO).default('transferencia'),
  referenciaPago: z.string().trim().max(100).optional().nullable(),
  diasVigencia: z.number().int().min(1).max(30).default(7),
  observaciones: z.string().trim().max(500).optional().nullable(),
  items: z
    .array(itemCotizacionB2BSchema)
    .min(1, { message: 'La cotización debe incluir al menos un producto.' }),
});

export const rechazarCotizacionB2BSchema = z.object({
  motivoRechazo: z
    .string({ required_error: 'El motivo del rechazo es obligatorio.' })
    .trim()
    .min(5, { message: 'El motivo de rechazo debe tener al menos 5 caracteres.' })
    .max(255),
});

export const facturarCotizacionB2BSchema = z.object({
  medioPago: z.enum(MEDIOS_PAGO).optional(),
  referenciaTransaccion: z.string().trim().max(100).optional().nullable(),
});

export const actualizarEstadoPedidoB2BSchema = z.object({
  estadoPedido: z.enum(ESTADOS_PEDIDO_B2B, {
    message: 'El estado del pedido debe ser en_proceso, despachado, entregado o cancelado.',
  }),
});

export const filtrosCotizacionesB2BSchema = z.object({
  estado: z.enum(ESTADOS_COTIZACION_B2B).optional(),
  estadoPedido: z.enum(ESTADOS_PEDIDO_B2B).optional(),
  clienteId: z.string().uuid().optional(),
  sucursalId: z.coerce.number().int().positive().optional(),
  limite: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export interface CotizacionB2BItemDto {
  id: string;
  cotizacionId: string;
  productoId: string;
  productoNombre?: string | null;
  productoSku?: string | null;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
}

export interface CotizacionB2BDto {
  id: string;
  consecutivo: number;
  clienteId: string;
  clienteNombre?: string | null;
  clienteDocumento?: string | null;
  vendedorId: string;
  vendedorEmail?: string | null;
  sucursalId: number;
  sucursalNombre?: string | null;
  subtotal: number;
  iva: number;
  total: number;
  medioPagoSugerido: (typeof MEDIOS_PAGO)[number];
  referenciaPago: string | null;
  estado: EstadoCotizacionB2B;
  estadoPedido: EstadoPedidoB2B | null;
  validaHasta: string;
  observaciones: string | null;
  aprobadoPor: string | null;
  aprobadoPorEmail?: string | null;
  fechaAval: string | null;
  motivoRechazo: string | null;
  facturaId: string | null;
  createdAt: string;
  updatedAt: string;
  items: CotizacionB2BItemDto[];
}

export type CrearCotizacionB2BInput = z.infer<typeof crearCotizacionB2BSchema>;
export type RechazarCotizacionB2BInput = z.infer<typeof rechazarCotizacionB2BSchema>;
export type FacturarCotizacionB2BInput = z.infer<typeof facturarCotizacionB2BSchema>;
export type ActualizarEstadoPedidoB2BInput = z.infer<typeof actualizarEstadoPedidoB2BSchema>;
export type FiltrosCotizacionesB2BInput = z.infer<typeof filtrosCotizacionesB2BSchema>;
