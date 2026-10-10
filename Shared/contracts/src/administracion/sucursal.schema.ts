import { z } from 'zod';

export const crearSucursalSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio.' })
    .trim()
    .min(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
    .max(150),
  direccion: z.string().trim().max(255).optional(),
  contacto: z.string().trim().max(100).optional(),
});

export const editarSucursalSchema = crearSucursalSchema
  .partial()
  .extend({ isActive: z.boolean().optional() })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'Envía al menos un campo a modificar.',
  });

export type CrearSucursalInput = z.infer<typeof crearSucursalSchema>;
export type EditarSucursalInput = z.infer<typeof editarSucursalSchema>;