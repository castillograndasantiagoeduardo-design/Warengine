import { z } from 'zod';
import { DomainError, Result } from '@warengine/shared-kernel';
import { PERMISSIONS, TOOL_NAMES, estadoFacturaMcpSchema, type EstadoFacturaMcpDTO } from '@warengine/contracts';
import { FacturaNoEncontradaError } from '@warengine/core';
import type { AppContainer } from '@warengine/composition';
import type { DefinicionToolMcp } from '../../catalog/tool-definition.ts';
import type { McpSessionContext } from '../../session/index.ts';

export interface DetalleFacturaMcp {
  id: string;
  consecutivo: number;
  sucursalId: number;
  clienteId: string;
  fecha: string;
  estado: 'emitida' | 'anulada';
  subtotal: number;
  iva: number;
  total: number;
  totalItems: number;
  items: {
    productoId: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
  metodosPago: string[];
}

/**
 * Tool MCP: 'estado-factura' (RF-MCP-B3).
 *
 * Permite consultar el estado, cliente, total y desglose de un comprobante de pago emitido.
 * Si se especifica un número consecutivo o ID, busca el comprobante dentro del alcance permitido.
 */
export const estadoFacturaTool: DefinicionToolMcp<EstadoFacturaMcpDTO, DetalleFacturaMcp> = {
  name: TOOL_NAMES.ESTADO_FACTURA,
  description:
    'Consulta los detalles de una factura (número, cliente, total, estado emitida/anulada y desglose de productos) por ID o consecutivo.',
  permisoRequerido: PERMISSIONS.FACTURACION_CONSULTAR,
  schema: estadoFacturaMcpSchema,
  shape: {
    numeroFactura: z.string().optional().describe('Número consecutivo o UUID de la factura a consultar'),
    facturaId: z.number().optional().describe('ID numérico/consecutivo de la factura'),
  },

  handler: async (
    args: EstadoFacturaMcpDTO,
    container: AppContainer,
    sessionContext: McpSessionContext,
  ): Promise<Result<DetalleFacturaMcp, DomainError>> => {
    // 1. Si viene un UUID o identificador directo, intentamos obtener por ID
    if (args.numeroFactura && args.numeroFactura.includes('-')) {
      const resultadoId = await container.facturacion.obtenerFacturaPorId.execute({
        id: args.numeroFactura,
        actor: sessionContext.actor,
      });

      if (resultadoId.isSuccess) {
        const fac = resultadoId.value;
        return Result.ok({
          id: fac.id,
          consecutivo: fac.consecutivo,
          sucursalId: fac.sucursalId,
          clienteId: fac.clienteId,
          fecha: fac.fecha instanceof Date ? fac.fecha.toISOString() : String(fac.fecha),
          estado: fac.estado,
          subtotal: fac.subtotal,
          iva: fac.iva,
          total: fac.total,
          totalItems: fac.items?.length ?? 0,
          items: (fac.items ?? []).map((it) => ({
            productoId: it.productoId,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario,
            subtotal: it.subtotal,
          })),
          metodosPago: (fac.pagos ?? []).map((p) => p.medioPago),
        });
      }
    }

    // 2. Si es consecutivo o número, listamos facturas para encontrar la coincidencia
    const consecutivoBuscado = args.facturaId ?? (args.numeroFactura ? Number(args.numeroFactura) : NaN);

    const facturasResult = await container.facturacion.listarFacturas.execute({
      limite: 100,
      offset: 0,
      actor: sessionContext.actor,
      sucursalId: sessionContext.esGlobal ? undefined : sessionContext.sucursalId ?? undefined,
    });

    if (facturasResult.isFailure) {
      return Result.fail(facturasResult.error);
    }

    const factura = facturasResult.value.find((f) => {
      if (!Number.isNaN(consecutivoBuscado)) {
        return f.consecutivo === consecutivoBuscado;
      }
      return f.id === args.numeroFactura;
    });

    if (!factura) {
      return Result.fail(new FacturaNoEncontradaError());
    }

    return Result.ok({
      id: factura.id,
      consecutivo: factura.consecutivo,
      sucursalId: factura.sucursalId,
      clienteId: factura.clienteId,
      fecha: factura.fecha instanceof Date ? factura.fecha.toISOString() : String(factura.fecha),
      estado: factura.estado,
      subtotal: factura.subtotal,
      iva: factura.iva,
      total: factura.total,
      totalItems: factura.items?.length ?? 0,
      items: (factura.items ?? []).map((it) => ({
        productoId: it.productoId,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
        subtotal: it.subtotal,
      })),
      metodosPago: (factura.pagos ?? []).map((p) => p.medioPago),
    });
  },

  formateador: (fac: DetalleFacturaMcp): string => {
    const estadoIcon = fac.estado === 'emitida' ? '🟢 EMITIDA / VÁLIDA' : '🔴 ANULADA';

    const lineas = [
      `### 🧾 Factura Electrónica #${fac.consecutivo}\n`,
      `- **Estado:** ${estadoIcon}`,
      `- **ID Interno:** \`${fac.id}\``,
      `- **Sucursal:** Sede #${fac.sucursalId}`,
      `- **Cliente ID:** \`${fac.clienteId}\``,
      `- **Fecha de Emisión:** ${fac.fecha}`,
      `- **Subtotal:** $${fac.subtotal.toFixed(2)}`,
      `- **IVA:** $${fac.iva.toFixed(2)}`,
      `- **TOTAL:** $${fac.total.toFixed(2)}`,
      `- **Método(s) de Pago:** ${fac.metodosPago.length > 0 ? fac.metodosPago.join(', ') : 'Efectivo'}`,
      '',
    ];

    if (fac.items.length > 0) {
      lineas.push('#### Desglose de Artículos:');
      for (const item of fac.items) {
        lineas.push(
          `- ${item.cantidad}x Producto (\`${item.productoId}\`) a $${item.precioUnitario.toFixed(2)} c/u = **$${item.subtotal.toFixed(2)}**`,
        );
      }
    }

    return lineas.join('\n');
  },
};
