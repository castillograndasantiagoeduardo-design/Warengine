import { z } from 'zod';
import { fechaIsoSchema } from './activo.schema.ts';

export const TIPOS_MANTENIMIENTO_VALORES = ['preventivo', 'correctivo'] as const;
export type TipoMantenimientoContrato = (typeof TIPOS_MANTENIMIENTO_VALORES)[number];

export const registrarMantenimientoSchema = z.object({
  tipo: z.enum(TIPOS_MANTENIMIENTO_VALORES, {
    message: 'El tipo debe ser preventivo o correctivo.',
  }),
  proveedorId: z.number().int().positive().optional(),
  fecha: fechaIsoSchema.optional(),
  costo: z.number().nonnegative().optional(),
  descripcion: z.string().trim().max(500).optional(),
});

export const finalizarMantenimientoSchema = z.object({
  fechaFin: fechaIsoSchema.optional(),
  costo: z.number().nonnegative().optional(),
  descripcion: z.string().trim().max(500).optional(),
});

export type RegistrarMantenimientoInput = z.infer<typeof registrarMantenimientoSchema>;
export type FinalizarMantenimientoInput = z.infer<typeof finalizarMantenimientoSchema>;