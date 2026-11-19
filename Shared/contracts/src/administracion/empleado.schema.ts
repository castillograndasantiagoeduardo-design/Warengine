/**
 * empleado.schema.ts
 *
 * Contratos de validación Zod y tipos TypeScript para la consulta y edición de empleados.
 *
 * Rol en la arquitectura:
 * - Capa Shared Contracts: define las estructuras y validaciones que cruzan la frontera
 *   entre la presentación (API REST / Frontend) y la aplicación.
 * - Los controladores consumen estos esquemas para validar parámetros de consulta y cuerpos de petición.
 *
 * Requisito SRS:
 * - RF-ADM-C12: Edición independiente de datos de empleados (información de contacto, cargo y área).
 * - RF-ADM-C5: Consulta y filtrado de personal.
 */

import { z } from 'zod';

export const editarEmpleadoSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
      .max(150, { message: 'El nombre no puede exceder 150 caracteres.' })
      .optional(),
    telefono: z
      .string()
      .trim()
      .max(30, { message: 'El teléfono no puede exceder 30 caracteres.' })
      .nullable()
      .optional(),
    direccion: z
      .string()
      .trim()
      .max(255, { message: 'La dirección no puede exceder 255 caracteres.' })
      .nullable()
      .optional(),
    cargo: z
      .string()
      .trim()
      .max(100, { message: 'El cargo no puede exceder 100 caracteres.' })
      .nullable()
      .optional(),
    areaId: z
      .number({ invalid_type_error: 'El ID de área debe ser un número entero.' })
      .int()
      .positive({ message: 'El ID de área debe ser mayor a 0.' })
      .nullable()
      .optional(),
    isActive: z
      .boolean({ invalid_type_error: 'isActive debe ser un booleano.' })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar.',
  });

export const listarEmpleadosQuerySchema = z.object({
  sucursalId: z.coerce.number().int().positive().optional(),
  areaId: z.coerce.number().int().positive().optional(),
  isActive: z
    .enum(['true', 'false', '1', '0'])
    .transform((val) => val === 'true' || val === '1')
    .optional(),
  busqueda: z.string().trim().optional(),
  q: z.string().trim().optional(),
  cargo: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
  limite: z.coerce.number().int().positive().max(100).optional(),
});

export interface EmpleadoDto {
  id: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  cargo: string | null;
  areaId: number | null;
  areaNombre: string | null;
  sucursalId: number;
  sucursalNombre: string;
  fechaIngreso: string;
  sueldoActual: number | null;
  isActive: boolean;
}

export interface EmpleadosPaginadosDto {
  items: EmpleadoDto[];
  total: number;
  totalPaginas: number;
  page: number;
  limite: number;
}

export type EditarEmpleadoInput = z.infer<typeof editarEmpleadoSchema>;
export type ListarEmpleadosQuery = z.infer<typeof listarEmpleadosQuerySchema>;
