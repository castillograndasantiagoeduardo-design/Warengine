import { z } from 'zod';

/**
 * loginSchema — esquema de validación Zod para el inicio de sesión.
 *
 * Reglas:
 *  - email: formato de correo electrónico válido (se normaliza a minúsculas).
 *  - password: mínimo 8 caracteres.
 *
 * Este esquema es la única fuente de verdad para la forma del payload de login.
 * Tanto el backend (BACK) como el frontend (FRONT) lo importan desde este archivo.
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'El correo es obligatorio.' })
    .email({ message: 'Ingresa un correo electrónico válido.' })
    .toLowerCase(),
  password: z
    .string({ required_error: 'La contraseña es obligatoria.' })
    .min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
});

/** Tipo TypeScript inferido directamente del esquema Zod. */
export type LoginInput = z.infer<typeof loginSchema>;
