import { z } from 'zod';

/**
 * Esquema Zod para validar la inserción de un registro de auditoría MCP (RF-SA-I9).
 * Se dispara automáticamente tras la ejecución (o intento fallido) de cualquier Tool.
 */
export const registrarLogMcpSchema = z.object({
  toolName: z
    .string({ required_error: 'El nombre de la Tool es obligatorio.' })
    .trim()
    .min(1, 'El nombre de la Tool no puede estar vacío.')
    .max(100, 'El nombre de la Tool no puede exceder 100 caracteres.'),
  usuarioId: z
    .string({ required_error: 'El ID de usuario es obligatorio.' })
    .uuid('El ID de usuario debe tener formato UUID.')
    .nullable(),
  sucursalId: z
    .number({ invalid_type_error: 'El ID de sucursal debe ser numérico.' })
    .int('El ID de sucursal debe ser un entero.')
    .positive('El ID de sucursal debe ser positivo.')
    .nullable(),
  parametros: z
    .record(z.unknown())
    .nullable()
    .optional(),
  exitoso: z
    .boolean({ required_error: 'El indicador de éxito es obligatorio.' }),
  duracionMs: z
    .number({ required_error: 'La duración en milisegundos es obligatoria.' })
    .int('La duración debe ser un número entero.')
    .nonnegative('La duración no puede ser negativa.'),
  error: z
    .string()
    .nullable()
    .optional(),
});

export type RegistrarLogMcpDTO = z.infer<typeof registrarLogMcpSchema>;

/**
 * Esquema Zod para consultar y filtrar los logs de herramientas del servidor MCP.
 */
export const filtroLogsMcpSchema = z.object({
  usuarioId: z.string().uuid().optional(),
  toolName: z.string().trim().optional(),
  exitoso: z.boolean().optional(),
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido.').optional(),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido.').optional(),
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(100).default(20),
});

export type FiltroLogsMcpDTO = z.infer<typeof filtroLogsMcpSchema>;

/**
 * Representación serializada de un registro de ejecución de Tool MCP.
 */
export interface LogMcpToolDTO {
  id: number;
  toolName: string;
  usuarioId: string | null;
  usuarioNombre?: string | null;
  sucursalId: number | null;
  sucursalNombre?: string | null;
  parametros: Record<string, unknown> | null;
  exitoso: boolean;
  duracionMs: number;
  error: string | null;
  fecha: string;
}
