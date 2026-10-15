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

