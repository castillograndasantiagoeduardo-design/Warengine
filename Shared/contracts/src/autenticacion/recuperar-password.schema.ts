import { z } from 'zod';

/**
 * Esquema de validación para solicitar el enlace de recuperación de contraseña (RF-SA-H1).
 */
export const solicitarRecuperacionPasswordSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio.' })
    .email({ message: 'Ingresa un correo electrónico válido.' })
    .toLowerCase(),
});

export type SolicitarRecuperacionPasswordInput = z.infer<typeof solicitarRecuperacionPasswordSchema>;

/**
 * Esquema de validación para verificar la validez de un token de recuperación (RF-SA-H4).
 */
export const validarTokenPasswordResetSchema = z.object({
  token: z
    .string({ required_error: 'El token de recuperación es obligatorio.' })
    .min(1, 'El token de recuperación no puede estar vacío.'),
});

export type ValidarTokenPasswordResetInput = z.infer<typeof validarTokenPasswordResetSchema>;

/**
 * Esquema de validación para restablecer la contraseña con nueva clave y confirmación (RF-SA-H6).
 */
export const confirmarRestablecerPasswordSchema = z
  .object({
    token: z
      .string({ required_error: 'El token de recuperación es obligatorio.' })
      .min(1, 'El token de recuperación no puede estar vacío.'),
    nuevaPassword: z
      .string({ required_error: 'La nueva contraseña es obligatoria.' })
      .min(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres.' }),
    confirmarPassword: z
      .string({ required_error: 'La confirmación de la contraseña es obligatoria.' })
      .min(8, { message: 'La confirmación debe tener al menos 8 caracteres.' }),
  })
  .refine((data) => data.nuevaPassword === data.confirmarPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmarPassword'],
  });

export type ConfirmarRestablecerPasswordInput = z.infer<typeof confirmarRestablecerPasswordSchema>;
