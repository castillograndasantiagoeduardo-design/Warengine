import { z } from 'zod';
import { paginacionSchema } from '../common/index.ts';
import { fechaIsoSchema } from './activo.schema.ts';

export const TIPOS_MANTENIMIENTO_VALORES = ['preventivo', 'correctivo'] as const;
export type TipoMantenimientoContrato = (typeof TIPOS_MANTENIMIENTO_VALORES)[number];

export const registrarMantenimientoSchema = z.object({
  tipo: z.enum(TIPOS_MANTENIMIENTO_VALORES, {
    message: 'El tipo debe ser preventivo o correctivo.',
  }),
  proveedorId: z.number().int().positive().nullable().optional(),
  fecha: fechaIsoSchema.nullable().optional(),
  costo: z.number().nonnegative().nullable().optional(),
  descripcion: z.string().trim().max(500).nullable().optional(),
});

export const finalizarMantenimientoSchema = z.object({
  fechaFin: fechaIsoSchema.nullable().optional(),
  costo: z.number().nonnegative().nullable().optional(),
  descripcion: z.string().trim().max(500).nullable().optional(),
});

export const filtrosMantenimientosSchema = z
  .object({
    sucursalId: z.coerce.number().int().positive().optional(),
    activoId: z.string().optional(),
    tipo: z.enum(TIPOS_MANTENIMIENTO_VALORES).optional(),
    estado: z.enum(['todos', 'en_curso', 'finalizado']).optional(),
    desde: fechaIsoSchema.optional(),
    hasta: fechaIsoSchema.optional(),
    limite: z.coerce.number().int().positive().max(100).optional(),
  })
  .merge(paginacionSchema);

export type RegistrarMantenimientoInput = z.infer<typeof registrarMantenimientoSchema>;
export type FinalizarMantenimientoInput = z.infer<typeof finalizarMantenimientoSchema>;
export type FiltrosMantenimientosInput = z.infer<typeof filtrosMantenimientosSchema>;

export interface MantenimientoListadoItemDto {
  id: string;
  activoId: string;
  activoCodigo: string;
  activoNombre: string;
  sucursalId: number;
  proveedorId: number | null;
  proveedorNombre: string | null;
  tipo: TipoMantenimientoContrato;
  fecha: string;
  fechaFin: string | null;
  costo: number | null;
  descripcion: string | null;
  enCurso: boolean;
}

export interface ResumenMantenimientosDto {
  total: number;
  enCurso: number;
  finalizados: number;
  vencidos: number;
}

export interface MantenimientosPaginadosResponse {
  items: MantenimientoListadoItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  resumen?: ResumenMantenimientosDto;
}
