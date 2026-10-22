import { z } from 'zod';

/**
 * Esquema Zod para la Tool MCP: 'consulta-stock' (RF-MCP-A1).
 * Permite al asistente consultar las existencias disponibles y mínimas de un producto.
 * Puede buscar por SKU exacto o por coincidencia de nombre.
 * El campo sucursalId es opcional; si no se provee o el usuario no es SuperAdmin,
 * el MCP Gateway inyectará automáticamente la sucursal del token JWT.
 */
export const consultaStockMcpSchema = z
  .object({
    sku: z
      .string({ invalid_type_error: 'El SKU debe ser una cadena de texto.' })
      .trim()
      .min(1, 'El SKU no puede estar vacío.')
      .optional(),
    nombre: z
      .string({ invalid_type_error: 'El nombre debe ser una cadena de texto.' })
      .trim()
      .min(1, 'El nombre no puede estar vacío.')
      .optional(),
    sucursalId: z
      .number({ invalid_type_error: 'El ID de sucursal debe ser numérico.' })
      .int('El ID de sucursal debe ser un número entero.')
      .positive('El ID de sucursal debe ser positivo.')
      .optional(),
  })
  .refine((data) => Boolean(data.sku || data.nombre), {
    message: 'Debe proporcionar al menos el SKU o el nombre del producto para consultar stock.',
  });

export type ConsultaStockMcpDTO = z.infer<typeof consultaStockMcpSchema>;

/**
 * Esquema Zod para la Tool MCP: 'stock-bajo' (RF-MCP-A2).
 * Lista productos que se encuentran en o por debajo del umbral de stock mínimo.
 */
export const stockBajoMcpSchema = z.object({
  sucursalId: z
    .number({ invalid_type_error: 'El ID de sucursal debe ser numérico.' })
    .int('El ID de sucursal debe ser un número entero.')
    .positive('El ID de sucursal debe ser positivo.')
    .optional(),
  limite: z
    .number({ invalid_type_error: 'El límite debe ser un número entero.' })
    .int('El límite debe ser un número entero.')
    .positive('El límite debe ser mayor a cero.')
    .max(100, 'El límite máximo de productos a consultar es 100.')
    .default(20),
});

export type StockBajoMcpDTO = z.infer<typeof stockBajoMcpSchema>;

/**
 * Esquema Zod para la Tool MCP de mutación: 'crear-producto' (Exclusivo SuperAdmin).
 * Permite registrar un nuevo artículo en el catálogo maestro a través del asistente.
 */
export const crearProductoMcpSchema = z.object({
  sku: z
    .string({ required_error: 'El SKU es obligatorio.' })
    .trim()
    .min(3, 'El SKU debe tener al menos 3 caracteres.')
    .max(50, 'El SKU no puede exceder 50 caracteres.'),
  nombre: z
    .string({ required_error: 'El nombre del producto es obligatorio.' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(150, 'El nombre no puede exceder 150 caracteres.'),
  precioVenta: z.coerce
    .number({ required_error: 'El precio de venta es obligatorio.' })
    .positive('El precio de venta debe ser mayor a cero.'),
  precioCompra: z.coerce
    .number({ required_error: 'El precio de compra es obligatorio.' })
    .nonnegative('El precio de compra no puede ser negativo.')
    .default(0),
  categoriaId: z.coerce
    .number({ required_error: 'El ID de categoría es obligatorio.' })
    .int('El ID de categoría debe ser un número entero.')
    .positive('El ID de categoría debe ser positivo.'),
  proveedorId: z.coerce
    .number({ required_error: 'El ID de proveedor es obligatorio.' })
    .int('El ID de proveedor debe ser un número entero.')
    .positive('El ID de proveedor debe ser positivo.'),
  descripcion: z
    .string()
    .trim()
    .max(500, 'La descripción no puede exceder 500 caracteres.')
    .optional(),
});

export type CrearProductoMcpDTO = z.infer<typeof crearProductoMcpSchema>;

/**
 * Esquema Zod para la Tool MCP de mutación: 'ajustar-stock' (Exclusivo SuperAdmin).
 * Permite registrar un ajuste de inventario (entrada o salida manual justificada).
 */
export const ajustarStockMcpSchema = z.object({
  productoId: z
    .string({ invalid_type_error: 'El ID de producto debe ser un UUID.' })
    .uuid('El ID de producto debe tener formato UUID.')
    .optional(),
  sku: z
    .string({ invalid_type_error: 'El SKU debe ser una cadena.' })
    .trim()
    .min(1, 'El SKU no puede estar vacío.')
    .optional(),
  sucursalId: z.coerce
    .number({ required_error: 'El ID de sucursal es obligatorio.' })
    .int('El ID de sucursal debe ser entero.')
    .positive('El ID de sucursal debe ser positivo.'),
  cantidad: z.coerce
    .number({ required_error: 'La cantidad a ajustar es obligatoria.' })
    .int('La cantidad debe ser un número entero.')
    .positive('La cantidad debe ser un entero positivo.'),
  tipo: z.enum(['ajuste_entrada', 'ajuste_salida'], {
    errorMap: () => ({ message: "El tipo de ajuste debe ser 'ajuste_entrada' o 'ajuste_salida'." }),
  }),
  motivo: z
    .string({ required_error: 'El motivo del ajuste es obligatorio por auditoría.' })
    .trim()
    .min(5, 'El motivo debe tener al menos 5 caracteres justificativos.')
    .max(255, 'El motivo no puede exceder 255 caracteres.'),
}).refine((data) => Boolean(data.productoId || data.sku), {
  message: 'Debe especificar el productoId o el sku del artículo a ajustar.',
});

export type AjustarStockMcpDTO = z.infer<typeof ajustarStockMcpSchema>;
