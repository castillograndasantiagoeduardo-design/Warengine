import { z } from 'zod';

/**
 * Esquema base de paginación para consultas de listado.
 */
export const paginacionSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

/**
 * Transforma un string query param ('true', '1', 'false', '0') a boolean o undefined.
 */
export const transformIsActive = z
  .string()
  .optional()
  .transform((val) => {
    if (val === undefined || val === '') return undefined;
    return val === 'true' || val === '1';
  });

export type PaginacionInput = z.infer<typeof paginacionSchema>;
