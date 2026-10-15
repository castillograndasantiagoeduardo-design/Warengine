import { z } from 'zod';

export const MEDIOS_PAGO = [
  'efectivo',
  'tarjeta',
  'transferencia',
  'credito_corporativo',
] as const;
export type MedioPago = (typeof MEDIOS_PAGO)[number];

export const ESTADOS_FACTURA = ['emitida', 'anulada'] as const;
export type EstadoFactura = (typeof ESTADOS_FACTURA)[number];

export const itemFacturaInputSchema = z.object({
  productoId: z.string().uuid({ message: 'El ID del producto debe ser un UUID válido.' }),
  cantidad: z
    .number({ required_error: 'La cantidad es obligatoria.' })
    .int({ message: 'La cantidad debe ser un entero.' })
    .positive({ message: 'La cantidad debe ser mayor a 0.' }),
  precioUnitario: z
    .number({ required_error: 'El precio unitario es obligatorio.' })
    .positive({ message: 'El precio unitario debe ser mayor a 0.' }),
  descuento: z
    .number()
    .min(0, { message: 'El descuento no puede ser negativo.' })
    .default(0),
});

export const pagoFacturaInputSchema = z.object({
  medioPago: z.enum(MEDIOS_PAGO, { message: 'Medio de pago no válido.' }),
  monto: z
    .number({ required_error: 'El monto es obligatorio.' })
    .positive({ message: 'El monto del pago debe ser mayor a 0.' }),
  referenciaTransaccion: z.string().trim().max(100).nullable().optional(),
});

export const crearFacturaSchema = z.object({
  clienteId: z.string().uuid({ message: 'El ID del cliente debe ser un UUID válido.' }),
  items: z
    .array(itemFacturaInputSchema)
    .min(1, { message: 'La factura debe contener al menos un producto.' }),
  pagos: z
    .array(pagoFacturaInputSchema)
    .min(1, { message: 'Debe incluir al menos un medio de pago.' }),
  esB2B: z.boolean().optional().default(false),
});

export const listarFacturasQuerySchema = z.object({
  clienteId: z.string().uuid().optional(),
  sucursalId: z.coerce.number().int().positive().optional(),
  fechaInicio: z.string().datetime().optional(),
  fechaFin: z.string().datetime().optional(),
  estado: z.enum(ESTADOS_FACTURA).optional(),
  limite: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export interface FacturaItemDto {
  id: string;
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
}

export interface FacturaPagoDto {
  id: string;
  medioPago: MedioPago;
  monto: number;
  referenciaTransaccion: string | null;
  fecha: string;
}

export interface FacturaDto {
  id: string;
  consecutivo: number;
  clienteId: string;
  usuarioId: string;
  sucursalId: number;
  turnoCajaId: string | null;
  subtotal: number;
  iva: number;
  total: number;
  estado: EstadoFactura;
  fecha: string;
  items: FacturaItemDto[];
  pagos: FacturaPagoDto[];
}

export type ItemFacturaInput = z.infer<typeof itemFacturaInputSchema>;
export type PagoFacturaInput = z.infer<typeof pagoFacturaInputSchema>;
export type CrearFacturaInput = z.infer<typeof crearFacturaSchema>;
export type ListarFacturasQuery = z.infer<typeof listarFacturasQuerySchema>;
