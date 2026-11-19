import { z } from 'zod';

export const abrirTurnoCajaSchema = z.object({
  fondoInicial: z
    .number({
      required_error: 'El fondo inicial es obligatorio.',
      invalid_type_error: 'El fondo inicial debe ser un número.',
    })
    .min(0, { message: 'El fondo inicial no puede ser negativo.' })
    .max(1_000_000_000, { message: 'El fondo inicial excede el máximo permitido.' }),
});

export const cerrarTurnoCajaSchema = z.object({
  fondoFinal: z
    .number({
      required_error: 'El fondo final es obligatorio.',
      invalid_type_error: 'El fondo final debe ser un número.',
    })
    .min(0, { message: 'El fondo final no puede ser negativo.' })
    .max(1_000_000_000, { message: 'El fondo final excede el máximo permitido.' }),
});

export const cierreAdministrativoTurnoSchema = z.object({
  motivo: z
    .string({ required_error: 'El motivo del cierre administrativo es obligatorio.' })
    .trim()
    .min(5, { message: 'El motivo debe tener al menos 5 caracteres.' })
    .max(500, { message: 'El motivo no puede exceder 500 caracteres.' }),
  fondoFinal: z
    .number({ invalid_type_error: 'El fondo final debe ser un número.' })
    .min(0, { message: 'El fondo final no puede ser negativo.' })
    .max(1_000_000_000, { message: 'El fondo final excede el máximo permitido.' })
    .optional(),
});

/** DTO de salida: lo que el FRONT recibe. */
export interface TurnoCajaDto {
  id: string;
  usuarioId: string;
  sucursalId: number;
  fondoInicial: number;
  fondoFinal?: number | null;
  diferencia?: number | null;
  fechaApertura: string;
  fechaCierre: string | null;
  estaAbierto: boolean;
  tipoCierre?: 'normal' | 'administrativo';
  cerradoPor?: string | null;
  cerradoPorNombre?: string | null;
  motivoCierre?: string | null;
}

export type AbrirTurnoCajaInput = z.infer<typeof abrirTurnoCajaSchema>;
export type CerrarTurnoCajaInput = z.infer<typeof cerrarTurnoCajaSchema>;
export type CierreAdministrativoTurnoInput = z.infer<typeof cierreAdministrativoTurnoSchema>;

// GET /ventas/turnos/abiertos — viene por query string, por eso coerce
export const listarTurnosAbiertosQuerySchema = z.object({
  sucursalId: z.coerce.number().int().positive().optional(),
});

/** Cajero en turno para el tablero de la sucursal. */
export interface TurnoAbiertoDto {
  id: string;
  usuarioId: string;
  cajeroNombre: string | null;
  cajeroEmail: string;
  sucursalId: number;
  fondoInicial: number;
  fechaApertura: string;
  cantidadVentas: number;
  totalVentas: number;
  efectivoEsperado?: number;
}

export type ListarTurnosAbiertosQuery = z.infer<typeof listarTurnosAbiertosQuerySchema>;

// GET /ventas/turnos/historial
export const historialTurnosQuerySchema = z.object({
  sucursalId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(100).default(20),
  desde: z.string().optional(),
  hasta: z.string().optional(),
  usuarioId: z.string().trim().optional(),
  tipoCierre: z.enum(['normal', 'administrativo']).optional(),
  conDiferencia: z
    .enum(['true', 'false', '1', '0'])
    .transform((val) => val === 'true' || val === '1')
    .optional(),
});

export type HistorialTurnosQuery = z.infer<typeof historialTurnosQuerySchema>;

export interface TurnoHistorialItemDto {
  id: string;
  usuarioId: string;
  cajeroNombre: string | null;
  cajeroEmail: string;
  sucursalId: number;
  sucursalNombre?: string | null;
  cajaNombre?: string | null;
  fondoInicial: number;
  fondoFinal: number | null;
  diferencia: number | null;
  fechaApertura: string;
  fechaCierre: string;
  tipoCierre: 'normal' | 'administrativo';
  cerradoPor: string | null;
  cerradoPorNombre?: string | null;
  motivoCierre?: string | null;
  totalVendido: number;
  cantidadVentas: number;
  efectivoEsperado: number;
}

export interface HistorialTurnosPaginadoDto {
  items: TurnoHistorialItemDto[];
  total: number;
  totalPaginas: number;
  page: number;
  limite: number;
}

export interface TurnoCorteDetalleDto {
  id: string;
  usuarioId: string;
  cajeroNombre: string | null;
  cajeroEmail: string;
  sucursalId: number;
  sucursalNombre: string;
  cajaNombre?: string | null;
  fondoInicial: number;
  fondoFinal: number | null;
  diferencia: number | null;
  fechaApertura: string;
  fechaCierre: string | null;
  tipoCierre: 'normal' | 'administrativo';
  cerradoPor: string | null;
  cerradoPorNombre?: string | null;
  motivoCierre?: string | null;
  cantidadVentas: number;
  totalVentas: number;
  ventasPorMetodo: {
    efectivo: number;
    tarjeta: number;
    transferencia: number;
    credito_corporativo: number;
  };
  efectivoEsperado: number;
}
