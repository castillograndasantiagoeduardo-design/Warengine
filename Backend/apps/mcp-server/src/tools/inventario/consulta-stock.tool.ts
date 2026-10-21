import { z } from 'zod';
import { DomainError, Result } from '@warengine/shared-kernel';
import { PERMISSIONS, TOOL_NAMES, consultaStockMcpSchema, type ConsultaStockMcpDTO } from '@warengine/contracts';
import { ProductoNoEncontradoError } from '@warengine/core';
import type { AppContainer } from '@warengine/composition';
import type { DefinicionToolMcp } from '../../catalog/tool-definition.ts';
import type { McpSessionContext } from '../../session/index.ts';

/**
 * Resultado estructurado retornado por la Tool consulta-stock.
 */
export interface DetalleStockProductoMcp {
  productoId: string;
  sku: string;
  nombre: string;
  sucursalId: number;
  nombreSucursal: string;
  stockActual: number;
  stockMinimo: number;
  alertaAbastecimiento: boolean;
  precioVenta: number;
}

/**
 * Tool MCP: 'consulta-stock' (RF-MCP-A1).
 *
 * Permite al modelo de IA consultar existencias disponibles y umbrales mínimos de stock.
 * Soporta búsqueda por SKU exacto o por coincidencia en el nombre comercial del producto.
 * Si el usuario es de sede local, el McpAuthorizationGateway fuerza su sucursalId (RF-SA-I4).
 */
export const consultaStockTool: DefinicionToolMcp<ConsultaStockMcpDTO, DetalleStockProductoMcp[]> = {
  name: TOOL_NAMES.CONSULTA_STOCK,
  description:
    'Consulta existencias actuales, umbral de stock mínimo y alertas de abastecimiento de productos por SKU o nombre en una sucursal.',
  permisoRequerido: PERMISSIONS.MCP_CONSULTAR,
  schema: consultaStockMcpSchema,
  shape: {
    sku: z.string().optional().describe('SKU exacto o parcial del producto a consultar'),
    nombre: z.string().optional().describe('Nombre descriptivo o palabra clave del producto'),
    sucursalId: z
      .number()
      .optional()
      .describe('ID de la sucursal a consultar (opcional para SuperAdmin, inyectado automáticamente para sede local)'),
  },

  /**
   * Manejador de la Tool:
   * 1. Busca el producto en el catálogo maestro a través de ListarProductosUseCase.
   * 2. Si no se halla ninguna coincidencia, retorna un error de dominio ProductoNoEncontradoError.
   * 3. Para cada coincidencia (hasta 5), consulta su stock en la sede objetivo mediante ConsultarStockSucursalUseCase.
   */
  handler: async (
    args: ConsultaStockMcpDTO,
    container: AppContainer,
    sessionContext: McpSessionContext,
  ): Promise<Result<DetalleStockProductoMcp[], DomainError>> => {
    const textoBusqueda = args.sku?.trim() || args.nombre?.trim() || '';

    // 1. Localizar productos en el catálogo
    const resultadoBusqueda = await container.inventario.listarProductos.execute({
      texto: textoBusqueda,
      page: 1,
      limit: 5,
      actor: sessionContext.actor,
    });

    if (resultadoBusqueda.isFailure) {
      return Result.fail(resultadoBusqueda.error);
    }

    const productos = resultadoBusqueda.value.items;
    if (productos.length === 0) {
      return Result.fail(new ProductoNoEncontradoError());
    }

    // 2. Determinar la sucursal de consulta:
    // Si args.sucursalId fue especificado (o inyectado por el Gateway), se usa ese.
    // De lo contrario, si la sesión tiene sucursal asociada se usa esa; sino por defecto sucursal 1.
    const sucursalObjetivo = args.sucursalId ?? sessionContext.sucursalId ?? 1;

    const detalles: DetalleStockProductoMcp[] = [];

    // 3. Consultar existencias de cada producto coincidente
    for (const prod of productos) {
      const stockResult = await container.inventario.consultarStockSucursal.execute({
        productoId: prod.id,
        sucursalId: sucursalObjetivo,
        actor: sessionContext.actor,
      });

      if (stockResult.isSuccess) {
        const detalle = stockResult.value;
        detalles.push({
          productoId: prod.id,
          sku: prod.sku,
          nombre: prod.nombre,
          sucursalId: detalle.sucursalId,
          nombreSucursal: detalle.nombreSucursal,
          stockActual: detalle.stockActual,
          stockMinimo: detalle.stockMinimo,
          alertaAbastecimiento: detalle.alertaAbastecimiento,
          precioVenta: prod.precioVenta,
        });
      }
    }

    if (detalles.length === 0) {
      return Result.fail(new ProductoNoEncontradoError());
    }

    return Result.ok(detalles);
  },

  /**
   * Formateador en Markdown legible para el asistente conversacional.
   */
  formateador: (detalles: DetalleStockProductoMcp[]): string => {
    if (detalles.length === 0) {
      return 'No se encontraron existencias para los criterios proporcionados.';
    }

    const lineas = ['### 📦 Consulta de Existencias e Inventario\n'];

    for (const d of detalles) {
      const estadoAlerta = d.alertaAbastecimiento
        ? '⚠️ **ALERTA: STOCK BAJO / CRÍTICO**'
        : '✅ **STOCK ADECUADO**';

      lineas.push(
        `- **Producto:** ${d.nombre} (SKU: \`${d.sku}\`)`,
        `  - **Sucursal:** ${d.nombreSucursal} (ID: ${d.sucursalId})`,
        `  - **Stock Actual:** ${d.stockActual} unidades`,
        `  - **Stock Mínimo Requerido:** ${d.stockMinimo} unidades`,
        `  - **Precio de Venta:** $${d.precioVenta.toFixed(2)}`,
        `  - **Estado:** ${estadoAlerta}`,
        '',
      );
    }

    return lineas.join('\n');
  },
};
