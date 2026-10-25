import { z } from 'zod';
import { paginacionSchema, transformIsActive } from '../common/index.ts';

const nombreCategoria = z
  .string({ message: 'El nombre es obligatorio.' })
  .trim()
  .min(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  .max(100, { message: 'El nombre no puede exceder 100 caracteres.' });

export const crearCategoriaActivoSchema = z.object({ nombre: nombreCategoria });

export const editarCategoriaActivoSchema = z.object({ nombre: nombreCategoria });

export const cambiarEstadoCategoriaActivoSchema = z.object({
  isActive: z.boolean({ message: 'El campo isActive es obligatorio.' }),
});

export const filtrosCategoriasActivosSchema = z
  .object({
    busqueda: z.string().trim().optional(),
    isActive: transformIsActive,
  })
  .merge(paginacionSchema);

export type CrearCategoriaActivoInput = z.infer<typeof crearCategoriaActivoSchema>;
export type EditarCategoriaActivoInput = z.infer<typeof editarCategoriaActivoSchema>;
export type CambiarEstadoCategoriaActivoInput = z.infer<typeof cambiarEstadoCategoriaActivoSchema>;
export type FiltrosCategoriasActivosInput = z.infer<typeof filtrosCategoriasActivosSchema>;
