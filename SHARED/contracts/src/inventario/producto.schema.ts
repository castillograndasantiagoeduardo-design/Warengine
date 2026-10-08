import { z } from 'zod';
import { paginacionSchema, transformIsActive } from '../common/index.ts';

const tieneMaximoDosDecimales = (val: number) => {
  const str = val.toString();
  const decimales = str.includes('.') ? str.split('.')[1].length : 0;
  return decimales <= 2;
};

const validarPrecio = (nombreCampo: string) =>
  z
    .number({ required_error: `El ${nombreCampo} es obligatorio.` })
    .positive({ message: `El ${nombreCampo} debe ser mayor a 0.` })
    .refine(tieneMaximoDosDecimales, {
      message: `El ${nombreCampo} no puede tener más de 2 decimales.`,
    });

const validarPrecioOpcional = (nombreCampo: string) =>
  z
    .number()
    .positive({ message: `El ${nombreCampo} debe ser mayor a 0.` })
    .refine(tieneMaximoDosDecimales, {
      message: `El ${nombreCampo} no puede tener más de 2 decimales.`,
    });

export const crearProductoSchema = z.object({
  sku: z
    .string({ required_error: 'El SKU es obligatorio.' })
    .trim()
    .min(1, { message: 'El SKU no puede estar vacío.' })
    .max(50, { message: 'El SKU no puede exceder 50 caracteres.' }),
  nombre: z
    .string({ required_error: 'El nombre es obligatorio.' })
    .trim()
    .min(1, { message: 'El nombre no puede estar vacío.' })
    .max(200, { message: 'El nombre no puede exceder 200 caracteres.' }),
  categoriaId: z
    .number()
    .int({ message: 'El id de categoría debe ser entero.' })
    .positive({ message: 'El id de categoría debe ser positivo.' })
    .nullable()
    .optional(),
  proveedorId: z
    .number()
    .int({ message: 'El id de proveedor debe ser entero.' })
    .positive({ message: 'El id de proveedor debe ser positivo.' })
    .nullable()
    .optional(),
  precioCompra: validarPrecio('precio de compra'),
  precioVenta: validarPrecio('precio de venta'),
  precioCorporativo: validarPrecioOpcional('precio corporativo').nullable().optional(),
  stockInicial: z
    .number()
    .int({ message: 'El stock inicial debe ser un número entero.' })
    .nonnegative({ message: 'El stock inicial no puede ser negativo.' })
    .optional(),
  stockMinimo: z
    .number()
    .int({ message: 'El stock mínimo debe ser un número entero.' })
    .nonnegative({ message: 'El stock mínimo no puede ser negativo.' })
    .optional(),
});

export const editarProductoSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .min(1, { message: 'El SKU no puede estar vacío.' })
      .max(50, { message: 'El SKU no puede exceder 50 caracteres.' })
      .optional(),
    nombre: z
      .string()
      .trim()
      .min(1, { message: 'El nombre no puede estar vacío.' })
      .max(200, { message: 'El nombre no puede exceder 200 caracteres.' })
      .optional(),
    categoriaId: z
      .number()
      .int({ message: 'El id de categoría debe ser entero.' })
      .positive({ message: 'El id de categoría debe ser positivo.' })
      .nullable()
      .optional(),
    proveedorId: z
      .number()
      .int({ message: 'El id de proveedor debe ser entero.' })
      .positive({ message: 'El id de proveedor debe ser positivo.' })
      .nullable()
      .optional(),
    precioCompra: validarPrecioOpcional('precio de compra').optional(),
    precioVenta: validarPrecioOpcional('precio de venta').optional(),
    precioCorporativo: validarPrecioOpcional('precio corporativo').nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Envía al menos un campo a modificar.',
  });

export const cambiarEstadoProductoSchema = z.object({
  isActive: z.boolean({ required_error: 'El campo isActive es obligatorio.' }),
});

export const filtrosProductosSchema = z
  .object({
    texto: z.string().trim().optional(),
    categoriaId: z.coerce.number().int().positive().optional(),
    proveedorId: z.coerce.number().int().positive().optional(),
    isActive: transformIsActive,
    stockBajo: transformIsActive,
  })
  .merge(paginacionSchema);

export const productoResponseSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  nombre: z.string(),
  categoriaId: z.number().int().nullable(),
  proveedorId: z.number().int().nullable(),
  precioCompra: z.number(),
  precioVenta: z.number(),
  precioCorporativo: z.number().nullable(),
  precioCorporativoActualizadoEn: z.string().nullable(),
  isActive: z.boolean(),
});

export const productosPaginadosSchema = z.object({
  items: z.array(productoResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

export type CrearProductoInput = z.infer<typeof crearProductoSchema>;
export type EditarProductoInput = z.infer<typeof editarProductoSchema>;
export type CambiarEstadoProductoInput = z.infer<typeof cambiarEstadoProductoSchema>;
export type FiltrosProductosInput = z.infer<typeof filtrosProductosSchema>;
export type ProductoResponse = z.infer<typeof productoResponseSchema>;
export type ProductosPaginadosResponse = z.infer<typeof productosPaginadosSchema>;
