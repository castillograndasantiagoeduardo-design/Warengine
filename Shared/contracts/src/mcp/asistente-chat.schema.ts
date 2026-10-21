import { z } from 'zod';

/**
 * Esquema Zod para la petición de conversación con el Asistente IA (RF-SA-i1).
 */
export const chatMensajeSchema = z.object({
  mensaje: z
    .string({ required_error: 'El mensaje es obligatorio.' })
    .trim()
    .min(1, 'El mensaje no puede estar vacío.')
    .max(2000, 'El mensaje no puede exceder 2000 caracteres.'),
  historial: z
    .array(
      z.object({
        rol: z.enum(['user', 'model', 'assistant'], {
          errorMap: () => ({ message: "El rol debe ser 'user', 'model' o 'assistant'." }),
        }),
        texto: z.string().trim().min(1, 'El texto del mensaje no puede estar vacío.'),
      }),
    )
    .optional()
    .default([]),
});

export type ChatMensajeDTO = z.infer<typeof chatMensajeSchema>;

/**
 * Estructura de salida devuelta por el Asistente IA.
 */
export interface ChatRespuestaDTO {
  respuesta: string;
  toolsEjecutadas: string[];
  fecha: string;
}
