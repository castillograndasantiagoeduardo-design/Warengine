import { z } from 'zod';

/**
 * Esquema Zod para la Tool MCP: 'ventas-periodo' (RF-MCP-B1).
 * Permite consultar el volumen de ventas, ingresos acumulados y cantidad de facturas emitidas.
 * Se acota a la sucursal del token JWT del usuario conectado.
 */
export const ventasPeriodoMcpSchema = z.object({
  periodo: z
    .enum(['hoy', 'semana', 'mes', 'personalizado'], {
      errorMap: () => ({ message: "El período debe ser 'hoy', 'semana', 'mes' o 'personalizado'." }),
    })
    .default('hoy'),
  fechaInicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de inicio debe tener formato YYYY-MM-DD.')
    .optional(),
  fechaFin: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de fin debe tener formato YYYY-MM-DD.')
    .optional(),
  sucursalId: z
    .number({ invalid_type_error: 'El ID de sucursal debe ser numérico.' })
    .int('El ID de sucursal debe ser entero.')
    .positive('El ID de sucursal debe ser positivo.')
    .optional(),
});

export type VentasPeriodoMcpDTO = z.infer<typeof ventasPeriodoMcpSchema>;

/**
 * Esquema Zod para la Tool MCP: 'estado-factura' (RF-MCP-B3).
 * Permite consultar el estado, cliente, total y desglose de un comprobante de pago emitido.
 */
export const estadoFacturaMcpSchema = z
  .object({
    numeroFactura: z
      .string({ invalid_type_error: 'El número de factura debe ser texto.' })
      .trim()
      .min(1, 'El número de factura no puede estar vacío.')
      .optional(),
    facturaId: z
      .number({ invalid_type_error: 'El ID de factura debe ser numérico.' })
      .int('El ID de factura debe ser un entero.')
      .positive('El ID de factura debe ser positivo.')
      .optional(),
  })
  .refine((data) => Boolean(data.numeroFactura || data.facturaId), {
    message: 'Debe proporcionar el número de factura o el ID de la factura a consultar.',
  });

export type EstadoFacturaMcpDTO = z.infer<typeof estadoFacturaMcpSchema>;
