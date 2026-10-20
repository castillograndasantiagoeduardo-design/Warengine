import { z } from 'zod';

/**
 * Esquema Zod para la Tool MCP: 'metricas-globales' (RF-MCP-C1 / RF-SA-I3).
 * Restringido exclusivamente al rol SuperAdmin (permiso mcp:herramientas-financieras).
 * Consulta márgenes de ganancia, costos totales, ingresos brutos y balances consolidados de la empresa.
 */
export const metricasGlobalesMcpSchema = z.object({
  periodo: z
    .enum(['hoy', 'mes', 'año', 'personalizado'], {
      errorMap: () => ({ message: "El período debe ser 'hoy', 'mes', 'año' o 'personalizado'." }),
    })
    .default('mes'),
  fechaInicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de inicio debe tener formato YYYY-MM-DD.')
    .optional(),
  fechaFin: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de fin debe tener formato YYYY-MM-DD.')
    .optional(),
});

export type MetricasGlobalesMcpDTO = z.infer<typeof metricasGlobalesMcpSchema>;
