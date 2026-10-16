import { z } from 'zod';
import { transformIsActive } from '../common/index.ts';

/**
 * Esquema de validación para filtros de exportación de productos (RF-ADM-B21).
 */
export const filtrosExportarProductosSchema = z.object({
  texto: z.string().trim().optional(),
  categoriaId: z.coerce.number().int().positive().optional(),
  proveedorId: z.coerce.number().int().positive().optional(),
  isActive: transformIsActive,
  stockBajo: transformIsActive,
  sucursalId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50000).default(10000),
  formato: z.enum(['csv', 'json']).default('csv'),
});

export type FiltrosExportarProductosDTO = z.infer<typeof filtrosExportarProductosSchema>;

/**
 * Esquema de validación para filtros de exportación de kardex (RF-ADM-B21).
 */
export const filtrosExportarKardexSchema = z.object({
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
      errorMap: () => ({
        message: "El tipo debe ser 'entrada', 'salida', 'ajuste_entrada' o 'ajuste_salida'.",
      }),
    })
    .optional(),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
  proveedorId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50000).default(10000),
  formato: z.enum(['csv', 'json']).default('csv'),
});

export type FiltrosExportarKardexDTO = z.infer<typeof filtrosExportarKardexSchema>;

/**
 * Esquema de respuesta para exportación en formato JSON.
 */
export const resultadoExportacionSchema = z.object({
  total: z.number().int().nonnegative(),
  nombreArchivo: z.string(),
  csv: z.string(),
});

export type ResultadoExportacionDTO = z.infer<typeof resultadoExportacionSchema>;
