import { z } from 'zod';
import { paginacionSchema } from '../common/index.ts';

export const ESTADOS_ACTIVO_VALORES = ['disponible', 'asignado', 'mantenimiento', 'baja'] as const;
export type EstadoActivoContrato = (typeof ESTADOS_ACTIVO_VALORES)[number];

/** Fecha calendario YYYY-MM-DD (columnas DATE de MySQL). */
export const fechaIsoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe tener formato YYYY-MM-DD.' });

export const crearActivoSchema = z.object({
  codigoActivo: z
    .string({ message: 'El codigo del activo es obligatorio.' })
    .trim()
    .min(1, { message: 'El codigo del activo no puede estar vacio.' })
    .max(50, { message: 'El codigo del activo no puede exceder 50 caracteres.' }),
  nombre: z
    .string({ message: 'El nombre es obligatorio.' })
    .trim()
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
    .max(200, { message: 'El nombre no puede exceder 200 caracteres.' }),
  categoriaActivoId: z.number().int().positive().optional(),
  sucursalId: z.number({ message: 'La sucursal es obligatoria.' }).int().positive(),
  valorAdquisicion: z.number().nonnegative().optional(),
  fechaAdquisicion: fechaIsoSchema.optional(),
  condicion: z.string().trim().max(50).optional(),
});

export const filtrosActivosSchema = z
  .object({
    sucursalId: z.coerce.number().int().positive().optional(),
    categoriaActivoId: z.coerce.number().int().positive().optional(),
    areaId: z.coerce.number().int().positive().optional(),
    estado: z.enum(ESTADOS_ACTIVO_VALORES).optional(),
    busqueda: z.string().trim().optional(),
  })
  .merge(paginacionSchema);

export const darBajaActivoSchema = z.object({
  motivo: z
    .string({ message: 'El motivo de la baja es obligatorio.' })
    .trim()
    .min(10, { message: 'Describe el motivo de la baja (minimo 10 caracteres).' })
    .max(300, { message: 'El motivo no puede exceder 300 caracteres.' }),
});

export type CrearActivoInput = z.infer<typeof crearActivoSchema>;
export type FiltrosActivosInput = z.infer<typeof filtrosActivosSchema>;
export type DarBajaActivoInput = z.infer<typeof darBajaActivoSchema>;

/** DTO serializable para la API REST y la Tool MCP `consulta-activo` (RF-LOG-C4). */
export interface ActivoResponse {
  id: string;
  codigoActivo: string;
  nombre: string;
  categoriaActivoId: number | null;
  categoriaNombre: string | null;
  sucursalId: number;
  estado: EstadoActivoContrato;
  valorAdquisicion: number | null;
  fechaAdquisicion: string | null;
  condicion: string | null;
  isActive: boolean;
}

export interface ResponsableActivoResponse {
  tipo: 'empleado' | 'area';
  id: string | number;
  nombre: string | null;
  desde: string;
}

export interface ActivoConsultaResponse extends ActivoResponse {
  responsableActual: ResponsableActivoResponse | null;
  mantenimientoEnCurso: boolean;
}
