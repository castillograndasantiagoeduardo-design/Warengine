import { z } from 'zod';
import { DomainError, Result } from '@warengine/shared-kernel';
import { PERMISSIONS, TOOL_NAMES, consultaStockMcpSchema, type ConsultaStockMcpDTO } from '@warengine/contracts';
import { CategoriaNoEncontradaError, ProductoNoEncontradoError } from '@warengine/core';
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
  categoria?: string;
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
 * Soporta búsqueda por categoría, por SKU o por coincidencia en el nombre comercial del producto.
 * Si el usuario es de sede local, el McpAuthorizationGateway fuerza su sucursalId (RF-SA-I4 / RNF-ADM-04).
 * Si el usuario es SuperAdmin, puede consultar cualquier sucursal específica o de forma global.
 */
export const consultaStockTool: DefinicionToolMcp<ConsultaStockMcpDTO, DetalleStockProductoMcp[]> = {
  name: TOOL_NAMES.CONSULTA_STOCK,
  description:
    'Consulta existencias actuales, umbral de stock mínimo y alertas de abastecimiento de productos en una sucursal. ' +
    'Permite consultar todo el inventario, filtrar por categoría (ej. "computadores", "herramientas"), por SKU o por nombre de producto. ' +
    'Para administradores locales la sucursal se aplica automáticamente. SuperAdmin puede especificar sucursalId o consultar de forma global.',
  permisoRequerido: PERMISSIONS.MCP_CONSULTAR,
  schema: consultaStockMcpSchema,
  shape: {
    sku: z.string().optional().describe('SKU exacto o parcial del producto a consultar'),
    nombre: z.string().optional().describe('Nombre descriptivo o palabra clave del producto'),
    categoria: z.string().optional().describe('Nombre de la categoría de productos (ej: "computadores", "herramientas")'),
    categoriaId: z.number().optional().describe('ID numérico de la categoría'),
    sucursalId: z
      .number()
      .optional()
      .describe('ID de la sucursal a consultar (opcional para SuperAdmin, inyectado automáticamente para sede local)'),
    limite: z.number().optional().describe('Límite de productos a retornar (por defecto 25, máx 100)'),
  },

  /**
   * Manejador de la Tool:
   * 1. Resuelve la categoría si se especificó por nombre o ID.
   * 2. Determina la(s) sucursal(es) autorizada(s) para la consulta respetando RNF-ADM-04.
   * 3. Busca los productos coincidentes en el catálogo maestro a través de ListarProductosUseCase.
   * 4. Para cada producto y sucursal, consulta existencias mediante ConsultarStockSucursalUseCase.
   */
  handler: async (
    args: ConsultaStockMcpDTO,
    container: AppContainer,
    sessionContext: McpSessionContext,
  ): Promise<Result<DetalleStockProductoMcp[], DomainError>> => {
    // 1. Resolver categoriaId si se proporcionó categoria o categoriaId
    let resolvedCategoriaId: number | undefined = args.categoriaId;
    let categoriaNombreDetectado: string | undefined = undefined;

    if (resolvedCategoriaId === undefined && args.categoria) {
      const catTrim = args.categoria.trim();
      if (/^\d+$/.test(catTrim)) {
        resolvedCategoriaId = Number(catTrim);
      } else if (container.inventario.listarCategorias) {
        const catRes = await container.inventario.listarCategorias.execute({
          busqueda: catTrim,
          page: 1,
          limit: 10,
          isActive: true,
        });

        if (catRes.isSuccess && catRes.value.items.length > 0) {
          const matchExact = catRes.value.items.find(
            (c) => c.nombre.toLowerCase() === catTrim.toLowerCase(),
          );
          const cat = matchExact || catRes.value.items[0];
          resolvedCategoriaId = cat.id;
          categoriaNombreDetectado = cat.nombre;
        } else {
          return Result.fail(new CategoriaNoEncontradaError());
        }
      }
    }

    // 2. Determinar la(s) sucursal(es) a consultar respetando RNF-ADM-04
    // - Para usuarios locales (!esGlobal), el gateway ya asegura args.sucursalId = sessionContext.sucursalId
    // - Para SuperAdmin (esGlobal), si provee sucursalId se consulta esa; si no provee, se consultan todas las sedes activas
    let sucursalesObjetivo: number[] = [];

    if (!sessionContext.esGlobal) {
      const sucursalLocal = sessionContext.sucursalId ?? args.sucursalId ?? 1;
      sucursalesObjetivo = [sucursalLocal];
    } else {
      // SuperAdmin
      if (args.sucursalId !== undefined) {
        sucursalesObjetivo = [args.sucursalId];
      } else if (container.administracion.listarSucursales) {
        const sucursalesResult = await container.administracion.listarSucursales.execute();
        if (sucursalesResult.isSuccess && sucursalesResult.value.length > 0) {
          sucursalesObjetivo = sucursalesResult.value
            .filter((s) => s.isActive)
            .map((s) => s.id);
        } else {
          sucursalesObjetivo = [1];
        }
      } else {
        sucursalesObjetivo = [1];
      }
    }

    // 3. Localizar productos en el catálogo
    const textoBusqueda = args.sku?.trim() || args.nombre?.trim() || undefined;
    const limite = args.limite ?? 25;

    const resultadoBusqueda = await container.inventario.listarProductos.execute({
      texto: textoBusqueda,
      categoriaId: resolvedCategoriaId,
      page: 1,
      limit: limite,
      actor: sessionContext.actor,
    });

    if (resultadoBusqueda.isFailure) {
      return Result.fail(resultadoBusqueda.error);
    }

    const productos = resultadoBusqueda.value.items;
    if (productos.length === 0) {
      return Result.fail(new ProductoNoEncontradoError());
    }

    const detalles: DetalleStockProductoMcp[] = [];

    // 4. Consultar existencias de cada producto coincidente en cada sucursal objetivo
    for (const prod of productos) {
      for (const sucursalId of sucursalesObjetivo) {
        const stockResult = await container.inventario.consultarStockSucursal.execute({
          productoId: prod.id,
          sucursalId,
          actor: sessionContext.actor,
        });

        if (stockResult.isSuccess) {
          const detalle = stockResult.value;
          detalles.push({
            productoId: prod.id,
            sku: prod.sku,
            nombre: prod.nombre,
            categoria: categoriaNombreDetectado,
            sucursalId: detalle.sucursalId,
            nombreSucursal: detalle.nombreSucursal,
            stockActual: detalle.stockActual,
            stockMinimo: detalle.stockMinimo,
            alertaAbastecimiento: detalle.alertaAbastecimiento,
            precioVenta: prod.precioVenta,
          });
        }
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

    const categoriaHeader = detalles[0]?.categoria
      ? ` - Categoría: ${detalles[0].categoria}`
      : '';
    const lineas = [`### 📦 Consulta de Existencias e Inventario${categoriaHeader}\n`];

    lineas.push(`Total de registros: **${detalles.length}**\n`);

    for (const d of detalles) {
      const estadoAlerta = d.alertaAbastecimiento
        ? '⚠️ **ALERTA: STOCK BAJO / CRÍTICO**'
        : '✅ **STOCK ADECUADO**';

      lineas.push(
        `- **${d.nombre}** (SKU: \`${d.sku}\`)`,
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
