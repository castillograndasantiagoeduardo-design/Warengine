import { z } from 'zod';
import { DomainError, Result } from '@warengine/shared-kernel';
import { PERMISSIONS, TOOL_NAMES, ventasPeriodoMcpSchema, type VentasPeriodoMcpDTO } from '@warengine/contracts';
import type { AppContainer } from '@warengine/composition';
import type { DefinicionToolMcp } from '../../catalog/tool-definition.ts';
import type { McpSessionContext } from '../../session/index.ts';

export interface ResumenVentasPeriodoMcp {
  periodo: string;
  sucursalId: number | 'todas';
  rangoFechas: {
    desde?: string;
    hasta?: string;
  };
  totalFacturas: number;
  ingresosTotales: number;
  ticketPromedio: number;
  /** Solo visible si el usuario tiene PERMISSIONS.MCP_HERRAMIENTAS_FINANCIERAS (RF-SA-I3) */
  datosFinancierosSensibles?: {
    costoTotal: number;
    gananciaNeta: number;
    margenPorcentaje: number;
  };
}

/**
 * Calcula las fechas de inicio y fin según el período seleccionado.
 */
function calcularRangoFechas(periodo: 'hoy' | 'semana' | 'mes' | 'personalizado', inicioStr?: string, finStr?: string): {
  desde?: Date;
  hasta?: Date;
} {
  const ahora = new Date();

  if (periodo === 'hoy') {
    const desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
    const hasta = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
    return { desde, hasta };
  }

  if (periodo === 'semana') {
    const desde = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { desde, hasta: ahora };
  }

  if (periodo === 'mes') {
    const desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
    return { desde, hasta: ahora };
  }

  if (periodo === 'personalizado' && inicioStr) {
    const desde = new Date(`${inicioStr}T00:00:00`);
    const hasta = finStr ? new Date(`${finStr}T23:59:59`) : new Date();
    return { desde, hasta };
  }

  return {};
}

/**
 * Tool MCP: 'ventas-periodo' (RF-MCP-B1).
 *
 * Consulta ventas, ingresos brutos y transacciones emitidas en un rango temporal.
 * Respeta el principio de mínimo privilegio (RF-SA-I3): oculta costos y márgenes de ganancia
 * a menos que el usuario posea explícitamente el permiso `mcp:herramientas-financieras`.
 */
export const ventasPeriodoTool: DefinicionToolMcp<VentasPeriodoMcpDTO, ResumenVentasPeriodoMcp> = {
  name: TOOL_NAMES.VENTAS_PERIODO,
  description:
    'Consulta el balance comercial, volumen de ingresos y total de facturas emitidas en un período (hoy, semana, mes o personalizado).',
  permisoRequerido: PERMISSIONS.MCP_CONSULTAR,
  schema: ventasPeriodoMcpSchema,
  shape: {
    periodo: z
      .enum(['hoy', 'semana', 'mes', 'personalizado'])
      .describe("Período a consultar ('hoy', 'semana', 'mes' o 'personalizado')"),
    fechaInicio: z.string().optional().describe('Fecha inicio en formato YYYY-MM-DD (solo para personalizado)'),
    fechaFin: z.string().optional().describe('Fecha fin en formato YYYY-MM-DD (solo para personalizado)'),
    sucursalId: z
      .number()
      .optional()
      .describe('ID de sucursal para acotar la consulta (opcional para SuperAdmin, forzado para sede local)'),
  },

  handler: async (
    args: VentasPeriodoMcpDTO,
    container: AppContainer,
    sessionContext: McpSessionContext,
  ): Promise<Result<ResumenVentasPeriodoMcp, DomainError>> => {
    const sucursalId = args.sucursalId ?? (sessionContext.esGlobal ? undefined : sessionContext.sucursalId ?? undefined);
    const { desde, hasta } = calcularRangoFechas(args.periodo, args.fechaInicio, args.fechaFin);

    const resultado = await container.administracion.consultarMetricasGanancias.execute({
      usuarioId: sessionContext.usuarioId,
      sucursalId,
      desde,
      hasta,
    });

    if (resultado.isFailure) {
      return Result.fail(resultado.error);
    }

    const metricas = resultado.value;
    const puedeVerFinanzas = sessionContext.permisos.includes(PERMISSIONS.MCP_HERRAMIENTAS_FINANCIERAS);

    const resumen: ResumenVentasPeriodoMcp = {
      periodo: args.periodo,
      sucursalId: sucursalId ?? 'todas',
      rangoFechas: {
        desde: desde ? desde.toISOString().split('T')[0] : undefined,
        hasta: hasta ? hasta.toISOString().split('T')[0] : undefined,
      },
      totalFacturas: metricas.totalFacturas,
      ingresosTotales: metricas.ingresosTotales,
      ticketPromedio: metricas.ticketPromedio,
      ...(puedeVerFinanzas
        ? {
            datosFinancierosSensibles: {
              costoTotal: metricas.costoTotal,
              gananciaNeta: metricas.gananciaNeta,
              margenPorcentaje: metricas.margenPorcentaje,
            },
          }
        : {}),
    };

    return Result.ok(resumen);
  },

  formateador: (resumen: ResumenVentasPeriodoMcp): string => {
    const lineas = [
      `### 📊 Resumen de Ventas e Ingresos (${resumen.periodo.toUpperCase()})\n`,
      `- **Sede:** ${resumen.sucursalId === 'todas' ? 'Consolidado Global (Todas las sedes)' : `Sucursal #${resumen.sucursalId}`}`,
      `- **Rango de Fechas:** ${resumen.rangoFechas.desde ?? 'Histórico'} al ${resumen.rangoFechas.hasta ?? 'Presente'}`,
      `- **Facturas Emitidas:** ${resumen.totalFacturas} comprobantes`,
      `- **Ingresos Totales:** $${resumen.ingresosTotales.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
      `- **Ticket Promedio:** $${resumen.ticketPromedio.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
    ];

    if (resumen.datosFinancierosSensibles) {
      const f = resumen.datosFinancierosSensibles;
      lineas.push(
        '',
        '#### 🔒 Desglose Financiero Corporativo (Autorizado):',
        `- **Costo Total Mercancía:** $${f.costoTotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
        `- **Ganancia Neta:** $${f.gananciaNeta.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
        `- **Margen de Utilidad:** ${f.margenPorcentaje.toFixed(2)}%`,
      );
    }

    return lineas.join('\n');
  },
};
