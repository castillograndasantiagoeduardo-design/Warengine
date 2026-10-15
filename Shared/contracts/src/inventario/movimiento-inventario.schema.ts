import { z } from 'zod';

export const registrarEntradaSchema = z.object({
  productoId: z
    .string({ required_error: 'El id de producto es obligatorio.' })
    .uuid({ message: 'El id de producto debe ser un UUID válido.' }),
  sucursalId: z
    .number({ required_error: 'El id de sucursal es obligatorio.' })
    .int({ message: 'El id de sucursal debe ser un entero.' })
    .positive({ message: 'El id de sucursal debe ser positivo.' }),
  cantidad: z
    .number({ required_error: 'La cantidad es obligatoria.' })
    .int({ message: 'La cantidad debe ser un número entero.' })
    .positive({ message: 'La cantidad debe ser mayor a 0.' }),
  proveedorId: z
    .number()
    .int({ message: 'El id de proveedor debe ser un entero.' })
    .positive({ message: 'El id de proveedor debe ser positivo.' })
    .optional()
    .nullable(),
  motivo: z
    .string()
    .trim()
    .max(255, { message: 'El motivo no puede exceder 255 caracteres.' })
    .optional()
    .nullable(),
});

export type RegistrarEntradaDTO = z.infer<typeof registrarEntradaSchema>;

export const registrarSalidaSchema = z.object({
  productoId: z
    .string({ required_error: 'El id de producto es obligatorio.' })
    .uuid({ message: 'El id de producto debe ser un UUID válido.' }),
  sucursalId: z
    .number({ required_error: 'El id de sucursal es obligatorio.' })
    .int({ message: 'El id de sucursal debe ser un entero.' })
    .positive({ message: 'El id de sucursal debe ser positivo.' }),
  cantidad: z
    .number({ required_error: 'La cantidad es obligatoria.' })
    .int({ message: 'La cantidad debe ser un número entero.' })
    .positive({ message: 'La cantidad debe ser mayor a 0.' }),
  motivo: z
    .string({ required_error: 'El motivo de la salida es obligatorio.' })
    .trim()
    .min(3, { message: 'El motivo debe tener al menos 3 caracteres justificando la salida.' })
    .max(255, { message: 'El motivo no puede exceder 255 caracteres.' }),
});

export type RegistrarSalidaDTO = z.infer<typeof registrarSalidaSchema>;

/**
 * Esquema de validación para filtros de consulta del Kardex (RF-ADM-B10).
 * Soportado en query parameters con coerción de tipos numéricos y fechas.
 */
export const filtrosKardexSchema = z.object({
  productoId: z
    .string()
    .uuid({ message: 'El id de producto debe ser un UUID válido.' })
    .optional(),
  sucursalId: z.coerce
    .number()
    .int({ message: 'El id de sucursal debe ser un entero.' })
    .positive({ message: 'El id de sucursal debe ser positivo.' })
    .optional(),
  tipo: z
    .enum(['entrada', 'salida', 'ajuste_entrada', 'ajuste_salida'], {
      errorMap: () => ({ message: "El tipo debe ser 'entrada', 'salida', 'ajuste_entrada' o 'ajuste_salida'." }),
    })
    .optional(),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type FiltrosKardexDTO = z.infer<typeof filtrosKardexSchema>;

/**
 * Esquema de validación para filtros de consulta de entradas de mercancía (RF-ADM-B15).
 */
export const filtrosEntradasSchema = z.object({
  sucursalId: z.coerce
    .number()
    .int({ message: 'El id de sucursal debe ser un entero.' })
    .positive({ message: 'El id de sucursal debe ser positivo.' })
    .optional(),
  proveedorId: z.coerce
    .number()
    .int({ message: 'El id de proveedor debe ser un entero.' })
    .positive({ message: 'El id de proveedor debe ser positivo.' })
    .optional(),
  productoId: z
    .string()
    .uuid({ message: 'El id de producto debe ser un UUID válido.' })
    .optional(),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type FiltrosEntradasDTO = z.infer<typeof filtrosEntradasSchema>;

export const detalleEntradaResponseSchema = z.object({
  id: z.string().uuid(),
  productoId: z.string().uuid(),
  productoNombre: z.string().optional(),
  productoSku: z.string().optional(),
  sucursalId: z.number().int(),
  sucursalNombre: z.string().optional(),
  tipo: z.literal('entrada'),
  cantidad: z.number().int(),
  motivo: z.string().nullable().optional(),
  proveedorId: z.number().int().nullable().optional(),
  proveedorNombre: z.string().nullable().optional(),
  usuarioId: z.string(),
  usuarioNombre: z.string().nullable().optional(),
  fecha: z.union([z.string(), z.date()]),
});

export type DetalleEntradaResponse = z.infer<typeof detalleEntradaResponseSchema>;

export const entradasPaginadasResponseSchema = z.object({
  items: z.array(detalleEntradaResponseSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});

export type EntradasPaginadasResponse = z.infer<typeof entradasPaginadasResponseSchema>;

/**
 * Esquema para anulación de una entrada de mercancía (RF-ADM-B16).
 */
export const anularEntradaSchema = z.object({
  motivo: z
    .string({ required_error: 'El motivo de la anulación es obligatorio.' })
    .trim()
    .min(5, { message: 'El motivo de anulación debe tener al menos 5 caracteres justificando la causa.' })
    .max(255, { message: 'El motivo no puede exceder 255 caracteres.' }),
});

export type AnularEntradaDTO = z.infer<typeof anularEntradaSchema>;

export const anulacionEntradaResponseSchema = z.object({
  mensaje: z.string(),
  movimientoCompensatorioId: z.string().uuid(),
  entradaOriginalId: z.string().uuid(),
  productoId: z.string().uuid(),
  sucursalId: z.number().int(),
  cantidadRevertida: z.number().int(),
  stockResultante: z.number().int(),
});

export type AnulacionEntradaResponse = z.infer<typeof anulacionEntradaResponseSchema>;



