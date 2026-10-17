import { z } from 'zod';

/**
 * Esquema de validación para activar 2FA TOTP con el código de confirmación.
 */
export const activar2faSchema = z.object({
  secretBase32: z
    .string({ required_error: 'El secreto base32 es obligatorio.' })
    .min(16, 'El secreto debe tener al menos 16 caracteres.'),
  codigoTotp: z
    .string({ required_error: 'El código TOTP es obligatorio.' })
    .trim()
    .regex(/^\d{6}$/, 'El código TOTP debe contener exactamente 6 dígitos numéricos.'),
});

export type Activar2faInput = z.infer<typeof activar2faSchema>;

/**
 * Esquema de validación para el paso 2 del login con segundo factor 2FA.
 */
export const verificar2faLoginSchema = z.object({
  tempToken: z
    .string({ required_error: 'El token temporal de autenticación es obligatorio.' })
    .min(1, 'El token temporal es obligatorio.'),
  codigoTotp: z
    .string({ required_error: 'El código TOTP es obligatorio.' })
    .trim()
    .regex(/^\d{6}$/, 'El código TOTP debe contener exactamente 6 dígitos numéricos.'),
  recordarme: z.boolean().optional().default(false),
});

export type Verificar2faLoginInput = z.infer<typeof verificar2faLoginSchema>;

/**
 * Esquema de validación para desactivar 2FA (exige la contraseña actual).
 */
export const desactivar2faSchema = z.object({
  password: z
    .string({ required_error: 'La contraseña actual es requerida para confirmar la desactivación.' })
    .min(1, 'La contraseña actual es obligatoria.'),
});

export type Desactivar2faInput = z.infer<typeof desactivar2faSchema>;
