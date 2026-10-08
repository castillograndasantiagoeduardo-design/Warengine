import { z } from 'zod';

export const crearCategoriaSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio.' })
    .trim()
    .min(1, { message: 'El nombre no puede estar vacío.' })
    .max(100, { message: 'El nombre no puede exceder 100 caracteres.' }),
});

export const editarCategoriaSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(1, { message: 'El nombre no puede estar vacío.' })
      .max(100, { message: 'El nombre no puede exceder 100 caracteres.' })
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Envía al menos un campo a modificar.',
  });

export const cambiarEstadoCategoriaSchema = z.object({
  isActive: z.boolean({ required_error: 'El campo isActive es obligatorio.' }),
});

export const filtrosCategoriasSchema = z.object({
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

export const categoriaResponseSchema = z.object({
  id: z.number().int(),
  nombre: z.string(),
  isActive: z.boolean(),
});

export const categoriasPaginadasSchema = z.object({
  items: z.array(categoriaResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

export type CrearCategoriaInput = z.infer<typeof crearCategoriaSchema>;
export type EditarCategoriaInput = z.infer<typeof editarCategoriaSchema>;
export type CambiarEstadoCategoriaInput = z.infer<typeof cambiarEstadoCategoriaSchema>;
export type FiltrosCategoriasInput = z.infer<typeof filtrosCategoriasSchema>;
export type CategoriaResponse = z.infer<typeof categoriaResponseSchema>;
export type CategoriasPaginadasResponse = z.infer<typeof categoriasPaginadasSchema>;
