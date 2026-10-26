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
}

export type AbrirTurnoCajaInput = z.infer<typeof abrirTurnoCajaSchema>;
export type CerrarTurnoCajaInput = z.infer<typeof cerrarTurnoCajaSchema>;
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
}

export type ListarTurnosAbiertosQuery = z.infer<typeof listarTurnosAbiertosQuerySchema>;
