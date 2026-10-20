import { z } from 'zod';

/**
 * Esquema Zod para la Tool MCP: 'consulta-activo' (RF-LOG-C4).
 * Permite consultar la ficha técnica, custodio actual, estado operativo
 * y ubicación de un activo fijo interno del negocio.
 */
export const consultaActivoMcpSchema = z
  .object({
    codigoInterno: z
      .string({ invalid_type_error: 'El código interno debe ser una cadena.' })
      .trim()
      .min(1, 'El código interno no puede estar vacío.')
      .optional(),
    serie: z
      .string({ invalid_type_error: 'El número de serie debe ser una cadena.' })
      .trim()
      .min(1, 'El número de serie no puede estar vacío.')
      .optional(),
    sucursalId: z
      .number({ invalid_type_error: 'El ID de sucursal debe ser un número entero.' })
      .int('El ID de sucursal debe ser un número entero.')
      .positive('El ID de sucursal debe ser positivo.')
      .optional(),
  })
  .refine((data) => Boolean(data.codigoInterno || data.serie || data.sucursalId), {
    message: 'Debe especificar el código interno, la serie o la sucursal del activo a consultar.',
  });

export type ConsultaActivoMcpDTO = z.infer<typeof consultaActivoMcpSchema>;
