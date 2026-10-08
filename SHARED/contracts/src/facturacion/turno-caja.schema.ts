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

/** DTO de salida: lo que el FRONT recibe. */
export interface TurnoCajaDto {
  id: string;
  usuarioId: string;
  sucursalId: number;
  fondoInicial: number;
  fechaApertura: string;
  fechaCierre: string | null;
  estaAbierto: boolean;
}

export type AbrirTurnoCajaInput = z.infer<typeof abrirTurnoCajaSchema>;