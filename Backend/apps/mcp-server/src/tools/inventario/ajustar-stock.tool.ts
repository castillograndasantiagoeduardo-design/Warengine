import { z } from 'zod';
import { DomainError, Result } from '@warengine/shared-kernel';
import { PERMISSIONS, TOOL_NAMES, ajustarStockMcpSchema, type AjustarStockMcpDTO } from '@warengine/contracts';
import { ProductoNoEncontradoError, StockInsuficienteError } from '@warengine/core';
import type { AppContainer } from '@warengine/composition';
import type { DefinicionToolMcp } from '../../catalog/tool-definition.ts';
import type { McpSessionContext } from '../../session/index.ts';

export interface AjusteStockMcpResultado {
  mensaje: string;
  ajusteRealizado: boolean;
  movimientoId: string | null;
  productoId: string;
  sku?: string;
  sucursalId: number;
  stockPrevio: number;
  stockFisico: number;
  diferencia: number;
  tipoAjuste: 'ajuste_entrada' | 'ajuste_salida' | 'sin_cambio';
  motivo: string;
}

/**
 * Tool MCP de Mutación: 'ajustar-stock' (RF-ADM-B17 / Exclusivo SuperAdmin).
 *
 * Permite registrar un ajuste manual justificado de inventario físico (entrada o salida).
 * Realiza verificación previa de existencias actuales para calcular el nuevo stock físico y conciliar.
 */
export const ajustarStockTool: DefinicionToolMcp<AjustarStockMcpDTO, AjusteStockMcpResultado> = {
  name: TOOL_NAMES.AJUSTAR_STOCK,
  description:
    'Registra un ajuste justificado de inventario físico (entrada o salida de existencias) para conciliar inventario real (Exclusivo SuperAdmin / inventario:ajustar-stock).',
  permisoRequerido: PERMISSIONS.INVENTARIO_AJUSTAR_STOCK,
  schema: ajustarStockMcpSchema,
  shape: {
    productoId: z.string().optional().describe('UUID del producto a ajustar'),
    sku: z.string().optional().describe('SKU del producto a ajustar si no se tiene el UUID'),
    sucursalId: z.number().int().positive().describe('ID de la sucursal donde se concilia el stock'),
    cantidad: z.number().int().positive().describe('Cantidad entera de unidades a incrementar o reducir'),
    tipo: z.enum(['ajuste_entrada', 'ajuste_salida']).describe("Tipo de ajuste: 'ajuste_entrada' o 'ajuste_salida'"),
    motivo: z.string().min(5).max(255).describe('Motivo y justificación obligatoria del ajuste (mínimo 5 caracteres)'),
  },

  handler: async (
    args: AjustarStockMcpDTO,
    container: AppContainer,
    sessionContext: McpSessionContext,
  ): Promise<Result<AjusteStockMcpResultado, DomainError>> => {
    let productoId = args.productoId;
    let skuEncontrado = args.sku;

    // 1. Si no viene productoId pero sí SKU, resolver el UUID a través de listarProductos
    if (!productoId && args.sku) {
      const busqueda = await container.inventario.listarProductos.execute({
        texto: args.sku,
        page: 1,
        limit: 1,
        actor: sessionContext.actor,
      });

      if (busqueda.isFailure) {
        return Result.fail(busqueda.error);
      }

      const prod = busqueda.value.items[0];
      if (!prod) {
        return Result.fail(new ProductoNoEncontradoError());
      }

      productoId = prod.id;
      skuEncontrado = prod.sku;
    }

    if (!productoId) {
      return Result.fail(new ProductoNoEncontradoError());
    }

    // 2. Consultar el stock actual en la sucursal para determinar el stock físico resultante
    const stockActualResult = await container.inventario.consultarStockSucursal.execute({
      productoId,
      sucursalId: args.sucursalId,
      actor: sessionContext.actor,
    });

    if (stockActualResult.isFailure) {
      return Result.fail(stockActualResult.error);
    }

    const stockActual = stockActualResult.value.stockActual;
    let stockFisico: number;

    if (args.tipo === 'ajuste_entrada') {
      stockFisico = stockActual + args.cantidad;
    } else {
      if (args.cantidad > stockActual) {
        return Result.fail(new StockInsuficienteError(stockActual, args.cantidad));
      }
      stockFisico = stockActual - args.cantidad;
    }

    // 3. Ejecutar el caso de uso central AjustarInventarioUseCase
    const ajusteResult = await container.inventario.ajustarInventario.execute({
      productoId,
      sucursalId: args.sucursalId,
      stockFisico,
      motivo: args.motivo,
      actor: sessionContext.actor,
    });

    if (ajusteResult.isFailure) {
      return Result.fail(ajusteResult.error);
    }

    const res = ajusteResult.value;

    return Result.ok({
      mensaje: res.mensaje,
      ajusteRealizado: res.ajusteRealizado,
      movimientoId: res.movimientoId ?? null,
      productoId: res.productoId,
      sku: skuEncontrado,
      sucursalId: res.sucursalId,
      stockPrevio: res.stockPrevio,
      stockFisico: res.stockFisico,
      diferencia: res.diferencia,
      tipoAjuste: res.tipoAjuste,
      motivo: args.motivo,
    });
  },

  formateador: (res: AjusteStockMcpResultado): string => {
    const signo = res.diferencia > 0 ? `+${res.diferencia}` : `${res.diferencia}`;
    return [
      '### ⚖️ Ajuste de Inventario Procesado con Éxito\n',
      `- **Mensaje:** ${res.mensaje}`,
      `- **ID Movimiento:** \`${res.movimientoId ?? 'N/A'}\``,
      `- **Producto ID:** \`${res.productoId}\`${res.sku ? ` (SKU: \`${res.sku}\`)` : ''}`,
      `- **Sucursal:** Sede #${res.sucursalId}`,
      `- **Stock Previo en Sistema:** ${res.stockPrevio} unidades`,
      `- **Nuevo Stock Físico Conciliado:** ${res.stockFisico} unidades`,
      `- **Variación:** **${signo} unidades** (${res.tipoAjuste})`,
      `- **Motivo Registrado:** *"${res.motivo}"*`,
      '',
      '> *El movimiento quedó asentado de forma inmutable en el Kardex y en la auditoría general.*',
    ].join('\n');
  },
};
