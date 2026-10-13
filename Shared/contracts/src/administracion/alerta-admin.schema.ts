/**
 * alerta-admin.schema.ts
 *
 * Contratos de validación Zod y tipos TypeScript para la gestión de alertas administrativas.
 *
 * Requisito SRS:
 * - RF-ADM-C13: Gestión de alertas administrativas (alertas_admin).
 */

import { z } from 'zod';

export const PRIORIDADES_ALERTA = ['urgente', 'normal'] as const;
export type PrioridadAlerta = (typeof PRIORIDADES_ALERTA)[number];

export const ESTADOS_ALERTA = ['pendiente', 'visto', 'atendido'] as const;
export type EstadoAlerta = (typeof ESTADOS_ALERTA)[number];

export const crearAlertaAdminSchema = z.object({
  sucursalId: z
    .number({ required_error: 'El ID de la sucursal es obligatorio.' })
    .int()
    .positive({ message: 'El ID de la sucursal debe ser un número entero positivo.' }),
  motivo: z
    .string({ required_error: 'El motivo es obligatorio.' })
    .trim()
    .min(2, { message: 'El motivo debe tener al menos 2 caracteres.' })
    .max(100, { message: 'El motivo no puede exceder 100 caracteres.' }),
  prioridad: z
    .enum(PRIORIDADES_ALERTA, {
      invalid_type_error: 'La prioridad debe ser "urgente" o "normal".',
    })
    .default('normal'),
  descripcion: z
    .string()
    .trim()
    .max(500, { message: 'La descripción no puede exceder 500 caracteres.' })
    .optional()
    .nullable(),
});

export const cambiarEstadoAlertaAdminSchema = z.object({
  estado: z.enum(['visto', 'atendido'], {
    required_error: 'El estado es obligatorio.',
    invalid_type_error: 'El nuevo estado debe ser "visto" o "atendido".',
  }),
});

export const listarAlertasAdminQuerySchema = z.object({
  sucursalId: z.coerce.number().int().positive().optional(),
  estado: z.enum(ESTADOS_ALERTA).optional(),
  prioridad: z.enum(PRIORIDADES_ALERTA).optional(),
});

export type CrearAlertaAdminInput = z.infer<typeof crearAlertaAdminSchema>;
export type CambiarEstadoAlertaAdminInput = z.infer<typeof cambiarEstadoAlertaAdminSchema>;
export type ListarAlertasAdminQuery = z.infer<typeof listarAlertasAdminQuerySchema>;
