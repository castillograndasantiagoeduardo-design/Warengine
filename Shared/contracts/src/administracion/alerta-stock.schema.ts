import { z } from 'zod';
import { paginacionSchema } from '../common/paginacion.schema.ts';

// RF-ADM-A6: alertas de agotamiento de stock. La sucursal es opcional; si no se envía,
// se muestran todas las que el usuario tiene permitidas (el Super Admin ve todas).
export const filtrosAlertasStockSchema = z
  .object({
    sucursalId: z.coerce.number().int().positive().optional(),
  })
  .merge(paginacionSchema);

export type FiltrosAlertasStockInput = z.infer<typeof filtrosAlertasStockSchema>;