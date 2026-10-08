import { z } from 'zod';

export const crearProveedorSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio.' })
    .trim()
    .min(1, { message: 'El nombre no puede estar vacío.' })
    .max(150, { message: 'El nombre no puede exceder 150 caracteres.' }),
  contacto: z
    .string()
    .trim()
    .max(100, { message: 'El contacto no puede exceder 100 caracteres.' })
    .nullable()
    .optional(),
});

export const editarProveedorSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(1, { message: 'El nombre no puede estar vacío.' })
      .max(150, { message: 'El nombre no puede exceder 150 caracteres.' })
      .optional(),
    contacto: z
      .string()
      .trim()
      .max(100, { message: 'El contacto no puede exceder 100 caracteres.' })
      .nullable()
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Envía al menos un campo a modificar.',
  });

export const cambiarEstadoProveedorSchema = z.object({
  isActive: z.boolean({ required_error: 'El campo isActive es obligatorio.' }),
});

export const filtrosProveedoresSchema = z.object({
  busqueda: z.string().trim().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return undefined;
      return val === 'true' || val === '1';
    }),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const proveedorResponseSchema = z.object({
  id: z.number().int(),
  nombre: z.string(),
  contacto: z.string().nullable(),
  isActive: z.boolean(),
});

export const proveedoresPaginadosSchema = z.object({
  items: z.array(proveedorResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

export type CrearProveedorInput = z.infer<typeof crearProveedorSchema>;
export type EditarProveedorInput = z.infer<typeof editarProveedorSchema>;
export type CambiarEstadoProveedorInput = z.infer<typeof cambiarEstadoProveedorSchema>;
export type FiltrosProveedoresInput = z.infer<typeof filtrosProveedoresSchema>;
export type ProveedorResponse = z.infer<typeof proveedorResponseSchema>;
export type ProveedoresPaginadosResponse = z.infer<typeof proveedoresPaginadosSchema>;
