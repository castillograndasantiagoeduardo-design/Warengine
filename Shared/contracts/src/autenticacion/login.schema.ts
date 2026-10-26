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
  recordarme: z.boolean().optional().default(false),
});

/** Tipo TypeScript inferido directamente del esquema Zod. */
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Esquema de datos de usuario retornados en la sesión autenticada (RF-SA-D5).
 */
export const usuarioSesionSchema = z.object({
  id: z.string(),
  email: z.string(),
  rolId: z.number(),
  rolNombre: z.string(),
  nombre: z.string().nullable(),
  /** Sede principal del empleado vinculado; null si el usuario no tiene sede asignada. */
  sucursalId: z.number().int().positive().nullable(),
  sucursalNombre: z.string().nullable(),
});

export type UsuarioSesionDto = z.infer<typeof usuarioSesionSchema>;

/**
 * Esquema completo de respuesta exitosa de login / verificación 2FA (RF-SA-D5).
 */
export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  usuario: usuarioSesionSchema,
  permisos: z.array(z.string()),
});

export type LoginResponseDto = z.infer<typeof loginResponseSchema>;

