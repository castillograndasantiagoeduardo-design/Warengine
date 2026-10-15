import { z } from 'zod';

/**
 * Esquema de validación para configurar el umbral de stock mínimo (RF-ADM-B11).
 * Permite definir el límite mínimo por producto y sucursal para disparar
 * alarmas de abastecimiento (RF-ADM-A3 / RNF-ADM-04).
 */
export const configurarStockMinimoSchema = z.object({
  productoId: z
    .string({ required_error: 'El id de producto es obligatorio.' })
    .uuid({ message: 'El id de producto debe ser un UUID válido.' }),
  sucursalId: z
    .number({ required_error: 'El id de sucursal es obligatorio.' })
    .int({ message: 'El id de sucursal debe ser un entero.' })
    .positive({ message: 'El id de sucursal debe ser positivo.' }),
  stockMinimo: z
    .number({ required_error: 'El stock mínimo es obligatorio.' })
    .int({ message: 'El stock mínimo debe ser un número entero.' })
    .nonnegative({ message: 'El stock mínimo no puede ser negativo.' }),
});

export type ConfigurarStockMinimoDTO = z.infer<typeof configurarStockMinimoSchema>;

/**
 * Esquema de validación para consultar el estado del stock por sucursal y producto.
 */
export const consultarStockSucursalParamsSchema = z.object({
  sucursalId: z.coerce
    .number({ required_error: 'El id de sucursal es obligatorio.' })
    .int({ message: 'El id de sucursal debe ser un entero.' })
    .positive({ message: 'El id de sucursal debe ser positivo.' }),
  productoId: z
    .string({ required_error: 'El id de producto es obligatorio.' })
    .uuid({ message: 'El id de producto debe ser un UUID válido.' }),
});

export type ConsultarStockSucursalParamsDTO = z.infer<typeof consultarStockSucursalParamsSchema>;

/**
 * DTO de respuesta detallada del stock de un producto en sucursal.
 */
export interface StockSucursalResponseDTO {
  productoId: string;
  nombreProducto: string;
  sku: string;
  sucursalId: number;
  nombreSucursal: string;
  stockActual: number;
  stockMinimo: number;
  alertaAbastecimiento: boolean;
}
