import { z } from 'zod';

export const crearUsuarioSchema = z.object({
  nombre: z.string({ required_error: 'El nombre es obligatorio.' }).trim().min(3).max(150),
  tipoDocumento: z.enum(['CC', 'CE'], { message: 'El tipo de documento debe ser CC o CE.' }),
  numeroDocumento: z.string().trim().min(5).max(30),
  email: z
    .string({ required_error: 'El correo es obligatorio.' })
    .email({ message: 'Ingresa un correo electrónico válido.' })
    .toLowerCase(),
  password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
  rolId: z.number().int().positive(),
  sucursalId: z.number().int().positive(),
  cargo: z.string().trim().max(100).optional(),
});

export const cambiarRolSchema = z.object({ rolId: z.number().int().positive() });
export const cambiarEstadoSchema = z.object({ isActive: z.boolean() });

// Vienen por query string, por eso coerce
export const filtrosUsuariosSchema = z.object({
  rolId: z.coerce.number().int().positive().optional(),
  sucursalId: z.coerce.number().int().positive().optional(),
});

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
export type CambiarRolInput = z.infer<typeof cambiarRolSchema>;
export type CambiarEstadoInput = z.infer<typeof cambiarEstadoSchema>;
export type FiltrosUsuariosInput = z.infer<typeof filtrosUsuariosSchema>;