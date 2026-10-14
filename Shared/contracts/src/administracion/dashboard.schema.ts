import { z } from 'zod';

export const metricasGananciasQuerySchema = z.object({
  sucursalId: z.coerce.number().int().positive().optional(),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
});
export type MetricasGananciasQuery = z.infer<typeof metricasGananciasQuerySchema>;

export const tendenciasVentasQuerySchema = z.object({
  agrupacion: z.enum(['dia', 'semana', 'mes']).default('dia'),
  sucursalId: z.coerce.number().int().positive().optional(),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
});
export type TendenciasVentasQuery = z.infer<typeof tendenciasVentasQuerySchema>;

export const rendimientoSucursalesQuerySchema = z.object({
  sucursalIds: z.preprocess((val) => {
    if (typeof val === 'string') {
      return val.split(',').map((v) => Number(v.trim())).filter((n) => !isNaN(n));
    }
    if (Array.isArray(val)) {
      return val.map((v) => Number(v)).filter((n) => !isNaN(n));
    }
    return undefined;
  }, z.array(z.number().int().positive()).optional()),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
});
export type RendimientoSucursalesQuery = z.infer<typeof rendimientoSucursalesQuerySchema>;

export const rankingProductosQuerySchema = z.object({
  orden: z.enum(['mas_vendidos', 'menos_vendidos']).default('mas_vendidos'),
  limite: z.coerce.number().int().min(1).max(100).default(10),
  sucursalId: z.coerce.number().int().positive().optional(),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
});
export type RankingProductosQuery = z.infer<typeof rankingProductosQuerySchema>;

export const comparativoInventarioQuerySchema = z.object({
  productoId: z.string().uuid().optional(),
  categoriaId: z.coerce.number().int().positive().optional(),
  sucursalIds: z.preprocess((val) => {
    if (typeof val === 'string') {
      return val.split(',').map((v) => Number(v.trim())).filter((n) => !isNaN(n));
    }
    if (Array.isArray(val)) {
      return val.map((v) => Number(v)).filter((n) => !isNaN(n));
    }
    return undefined;
  }, z.array(z.number().int().positive()).optional()),
  soloConStockBajo: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
});
export type ComparativoInventarioQuery = z.infer<typeof comparativoInventarioQuerySchema>;
