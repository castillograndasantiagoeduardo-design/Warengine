import { z } from 'zod';

/**
 * rol.schema.ts — Catálogo de roles (GET /administracion/roles).
 *
 * El endpoint no recibe parámetros; este esquema documenta y tipa la respuesta
 * que consume el selector de cambio de rol (RF-ADM-C7).
 */
export const rolResumenSchema = z.object({
  id: z.number().int().positive(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
});

export const listaRolesResponseSchema = z.array(rolResumenSchema);

export type RolResumenDto = z.infer<typeof rolResumenSchema>;
