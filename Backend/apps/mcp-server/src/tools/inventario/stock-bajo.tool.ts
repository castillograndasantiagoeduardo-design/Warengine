import { z } from 'zod';
import { DomainError, Result } from '@warengine/shared-kernel';
import { PERMISSIONS, TOOL_NAMES, stockBajoMcpSchema, type StockBajoMcpDTO } from '@warengine/contracts';
import type { AppContainer } from '@warengine/composition';
import type { DefinicionToolMcp } from '../../catalog/tool-definition.ts';
import type { McpSessionContext } from '../../session/index.ts';

export interface ResumenAlertaStockMcp {
  totalAlertas: number;
  sucursalConsultada: number | 'todas';
  alertas: {
    productoId: string;
    sku: string;
    nombre: string;
    sucursalId: number;
    sucursalNombre: string;
    stockActual: number;
    stockMinimo: number;
    faltante: number;
  }[];
}

/**
 * Tool MCP: 'stock-bajo' (RF-MCP-A2 / RF-ADM-A6).
 *
 * Lista los productos que se encuentran en o por debajo del umbral de stock mínimo.
 * Permite a los administradores y operarios anticipar quiebres de inventario y reabastecimiento.
 */
export const stockBajoTool: DefinicionToolMcp<StockBajoMcpDTO, ResumenAlertaStockMcp> = {
  name: TOOL_NAMES.STOCK_BAJO,
  description:
    'Lista los artículos de inventario con existencias críticas (stock en o por debajo del mínimo permitido) para planear reabastecimiento.',
  permisoRequerido: PERMISSIONS.MCP_CONSULTAR,
  schema: stockBajoMcpSchema,
  shape: {
    sucursalId: z
      .number()
      .optional()
      .describe('ID de la sucursal para filtrar alertas (opcional para SuperAdmin, forzada para sede local)'),
    limite: z
      .number()
      .optional()
      .describe('Número máximo de alertas a retornar (por defecto 20, máximo 100)'),
  },

  /**
   * Ejecuta el caso de uso ConsultarAlertasStockUseCase respetando RNF-ADM-04 (aislamiento por sede).
   */
  handler: async (
    args: StockBajoMcpDTO,
    container: AppContainer,
    sessionContext: McpSessionContext,
  ): Promise<Result<ResumenAlertaStockMcp, DomainError>> => {
    const sucursalId = args.sucursalId ?? (sessionContext.esGlobal ? undefined : sessionContext.sucursalId ?? undefined);
    const limite = args.limite ?? 20;

    const resultado = await container.administracion.consultarAlertasStock.execute({
      usuarioId: sessionContext.usuarioId,
      sucursalId,
      page: 1,
      limit: limite,
    });

    if (resultado.isFailure) {
      return Result.fail(resultado.error);
    }

    const items = resultado.value.items;

    return Result.ok({
      totalAlertas: resultado.value.total,
      sucursalConsultada: sucursalId ?? 'todas',
      alertas: items.map((a) => ({
        productoId: a.productoId,
        sku: a.sku,
        nombre: a.nombre,
        sucursalId: a.sucursalId,
        sucursalNombre: a.sucursalNombre,
        stockActual: a.stockActual,
        stockMinimo: a.stockMinimo,
        faltante: a.faltante,
      })),
    });
  },

  /**
   * Formateador en Markdown para el asistente conversacional.
   */
  formateador: (resumen: ResumenAlertaStockMcp): string => {
    if (resumen.alertas.length === 0) {
      return '✅ **Todo en orden:** No hay productos en estado crítico ni por debajo del stock mínimo para la sede consultada.';
    }

    const lineas = [
      `### ⚠️ Reporte de Stock Crítico y Mínimo (${resumen.alertas.length} alertas detectadas)\n`,
    ];

    for (const item of resumen.alertas) {
      const urgencia = item.stockActual === 0 ? '🔴 **AGOTADO (0 uds)**' : '🟡 **BAJO MÍNIMO**';

      lineas.push(
        `- **${item.nombre}** (SKU: \`${item.sku}\`)`,
        `  - **Sede:** ${item.sucursalNombre} (ID: ${item.sucursalId})`,
        `  - **Stock Actual:** ${item.stockActual} | **Mínimo:** ${item.stockMinimo}`,
        `  - **Faltante para Nivel Óptimo:** ${item.faltante} unidades`,
        `  - **Urgencia:** ${urgencia}`,
        '',
      );
    }

    return lineas.join('\n');
  },
};
