import { z } from 'zod';
import { DomainError, Result } from '@warengine/shared-kernel';
import { PERMISSIONS, TOOL_NAMES, crearProductoMcpSchema, type CrearProductoMcpDTO } from '@warengine/contracts';
import type { AppContainer } from '@warengine/composition';
import type { DefinicionToolMcp } from '../../catalog/tool-definition.ts';
import type { McpSessionContext } from '../../session/index.ts';

export interface ProductoCreadoMcp {
  id: string;
  sku: string;
  nombre: string;
  precioVenta: number;
  precioCompra: number;
  categoriaId: number | null;
  proveedorId: number | null;
  isActive: boolean;
}

/**
 * Tool MCP de Mutación: 'crear-producto' (Exclusivo SuperAdmin / inventario:escribir).
 *
 * Permite registrar un nuevo artículo en el catálogo maestro a través del asistente.
 * Valida unicidad de SKU, existencia de categoría y proveedor, y genera evento de auditoría.
 */
export const crearProductoTool: DefinicionToolMcp<CrearProductoMcpDTO, ProductoCreadoMcp> = {
  name: TOOL_NAMES.CREAR_PRODUCTO,
  description:
    'Crea y registra un nuevo artículo en el catálogo maestro de inventario (Exclusivo SuperAdmin / inventario:escribir).',
  permisoRequerido: PERMISSIONS.INVENTARIO_ESCRIBIR,
  schema: crearProductoMcpSchema,
  shape: {
    sku: z.string().min(3).max(50).describe('SKU único alfanumérico para el producto'),
    nombre: z.string().min(2).max(150).describe('Nombre comercial completo del producto'),
    precioVenta: z.number().positive().describe('Precio de venta al público (mayor a cero)'),
    precioCompra: z.number().nonnegative().default(0).describe('Precio de compra o costo base de adquisición'),
    categoriaId: z.number().int().positive().describe('ID de la categoría a la que pertenece'),
    proveedorId: z.number().int().positive().describe('ID del proveedor principal'),
    descripcion: z.string().optional().describe('Descripción o ficha técnica opcional'),
  },

  handler: async (
    args: CrearProductoMcpDTO,
    container: AppContainer,
    sessionContext: McpSessionContext,
  ): Promise<Result<ProductoCreadoMcp, DomainError>> => {
    const resultado = await container.inventario.crearProducto.execute({
      sku: args.sku,
      nombre: args.nombre,
      precioVenta: args.precioVenta,
      precioCompra: args.precioCompra ?? 0,
      categoriaId: args.categoriaId,
      proveedorId: args.proveedorId,
      actor: sessionContext.actor,
    });

    if (resultado.isFailure) {
      return Result.fail(resultado.error);
    }

    const prod = resultado.value;

    return Result.ok({
      id: prod.id,
      sku: prod.sku,
      nombre: prod.nombre,
      precioVenta: prod.precioVenta,
      precioCompra: prod.precioCompra,
      categoriaId: prod.categoriaId,
      proveedorId: prod.proveedorId,
      isActive: prod.isActive,
    });
  },

  formateador: (prod: ProductoCreadoMcp): string => {
    return [
      '### ✨ Producto Creado Exitosamente en el Catálogo Maestro\n',
      `- **Nombre:** ${prod.nombre}`,
      `- **SKU:** \`${prod.sku}\``,
      `- **ID Interno:** \`${prod.id}\``,
      `- **Precio de Venta:** $${prod.precioVenta.toFixed(2)}`,
      `- **Precio de Compra (Costo):** $${prod.precioCompra.toFixed(2)}`,
      `- **Categoría ID:** ${prod.categoriaId}`,
      `- **Proveedor ID:** ${prod.proveedorId}`,
      `- **Estado:** ${prod.isActive ? '🟢 Activo en Catálogo' : '⚪ Inactivo'}`,
      '',
      '> *El producto ya está disponible para recepción de existencias, ajustes y venta.*',
    ].join('\n');
  },
};
