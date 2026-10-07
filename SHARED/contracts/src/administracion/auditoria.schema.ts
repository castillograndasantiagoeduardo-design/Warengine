import { z } from 'zod';

const SOLO_DIA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Convierte el parámetro de fecha de la URL en Date (UTC).
 * Si llega solo el día (2026-10-06), "desde" es el inicio del día y "hasta" el final,
 * para que el filtro por rango incluya el día completo.
 */
function aFecha(valor: string, finDeDia: boolean): Date | null {
  const texto = SOLO_DIA.test(valor)
    ? `${valor}T${finDeDia ? '23:59:59.999' : '00:00:00.000'}Z`
    : valor;
  const fecha = new Date(texto);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

const fechaParam = (finDeDia: boolean) =>
  z
    .string()
    .trim()
    .transform((valor, ctx) => {
      const fecha = aFecha(valor, finDeDia);
      if (!fecha) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Fecha inválida. Usa YYYY-MM-DD o formato ISO.',
        });
        return z.NEVER;
      }
      return fecha;
    })
    .optional();

// Vienen por query string, por eso coerce
export const consultarAuditoriaSchema = z.object({
  usuarioId: z.string().uuid({ message: 'usuarioId debe ser un UUID.' }).optional(),
  accion: z.string().trim().min(1).max(50).optional(),
  entidad: z.string().trim().min(1).max(100).optional(),
  desde: fechaParam(false),
  hasta: fechaParam(true),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(200).default(50),
});

export type ConsultarAuditoriaInput = z.infer<typeof consultarAuditoriaSchema>;