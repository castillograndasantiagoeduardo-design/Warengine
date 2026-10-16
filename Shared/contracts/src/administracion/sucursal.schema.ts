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

export const cambiarEstadoSucursalSchema = z.object({
  isActive: z.boolean({ required_error: 'El campo isActive es obligatorio.' }),
});

export const detalleSucursalResponseSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  direccion: z.string().nullable(),
  contacto: z.string().nullable(),
  isActive: z.boolean(),
  usuariosAsignados: z.array(
    z.object({
      id: z.string(),
      email: z.string(),
      nombre: z.string(),
      cargo: z.string().nullable().optional(),
      rolId: z.number(),
      rolNombre: z.string(),
      isActive: z.boolean(),
      esSedePrincipal: z.boolean(),
    }),
  ),
  estadisticas: z.object({
    totalUsuariosAsignados: z.number(),
    productosConStock: z.number(),
    totalUnidadesStock: z.number(),
    totalVentas: z.number(),
    montoTotalVentas: z.number(),
  }),
  ventasRecientes: z.array(
    z.object({
      id: z.string(),
      consecutivo: z.number(),
      fecha: z.union([z.date(), z.string()]),
      total: z.number(),
      estado: z.string(),
      clienteNombre: z.string().nullable().optional(),
      clienteDocumento: z.string().nullable().optional(),
    }),
  ),
});

export type CrearSucursalInput = z.infer<typeof crearSucursalSchema>;
export type EditarSucursalInput = z.infer<typeof editarSucursalSchema>;
export type CambiarEstadoSucursalInput = z.infer<typeof cambiarEstadoSucursalSchema>;
export type DetalleSucursalResponse = z.infer<typeof detalleSucursalResponseSchema>;