import { z } from 'zod';
import { DomainError, Result } from '@warengine/shared-kernel';
import { PERMISSIONS, TOOL_NAMES, metricasGlobalesMcpSchema, type MetricasGlobalesMcpDTO } from '@warengine/contracts';
import type { AppContainer } from '@warengine/composition';
import type { DefinicionToolMcp } from '../../catalog/tool-definition.ts';
import type { McpSessionContext } from '../../session/index.ts';

export interface ReporteMetricasGlobalesMcp {
  periodo: string;
  rangoFechas: {
    desde?: string;
    hasta?: string;
  };
  consolidadoCorporativo: {
    ingresosTotales: number;
    costoTotal: number;
    gananciaNeta: number;
    margenPorcentaje: number;
    totalFacturas: number;
    ticketPromedio: number;
  };
  rendimientoPorSede: {
    sucursalId: number;
    nombreSucursal: string;
    totalVentas: number;
    totalFacturas: number;
    ticketPromedio: number;
    gananciaNeta: number;
  }[];
}

/**
 * Calcula las fechas correspondientes para análisis corporativo global.
 */
function calcularRangoGlobal(periodo: 'hoy' | 'mes' | 'año' | 'personalizado', inicioStr?: string, finStr?: string): {
  desde?: Date;
  hasta?: Date;
} {
  const ahora = new Date();

  if (periodo === 'hoy') {
    const desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
    const hasta = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
    return { desde, hasta };
  }

  if (periodo === 'mes') {
    const desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
    return { desde, hasta: ahora };
  }

  if (periodo === 'año') {
    const desde = new Date(ahora.getFullYear(), 0, 1, 0, 0, 0, 0);
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
 * Tool MCP: 'metricas-globales' (RF-MCP-C1 / RF-SA-I3).
 *
 * Restringida exclusivamente al perfil SuperAdmin (permiso `mcp:herramientas-financieras`).
 * Proporciona una vista ejecutiva completa de finanzas, costos, ganancias consolidadas y rendimiento por sucursal.
 */
export const metricasGlobalesTool: DefinicionToolMcp<MetricasGlobalesMcpDTO, ReporteMetricasGlobalesMcp> = {
  name: TOOL_NAMES.METRICAS_GLOBALES,
  description:
    'Proporciona el balance financiero consolidado global de la empresa: ingresos brutos, costos de mercancía, ganancias netas, margen porcentual y desglose por sucursal (Exclusivo SuperAdmin).',
  permisoRequerido: PERMISSIONS.MCP_HERRAMIENTAS_FINANCIERAS,
  schema: metricasGlobalesMcpSchema,
  shape: {
    periodo: z
      .enum(['hoy', 'mes', 'año', 'personalizado'])
      .describe("Período de análisis ('hoy', 'mes', 'año' o 'personalizado')"),
    fechaInicio: z.string().optional().describe('Fecha inicio YYYY-MM-DD para período personalizado'),
    fechaFin: z.string().optional().describe('Fecha fin YYYY-MM-DD para período personalizado'),
  },

  handler: async (
    args: MetricasGlobalesMcpDTO,
    container: AppContainer,
    sessionContext: McpSessionContext,
  ): Promise<Result<ReporteMetricasGlobalesMcp, DomainError>> => {
    const { desde, hasta } = calcularRangoGlobal(args.periodo, args.fechaInicio, args.fechaFin);

    // 1. Obtener métricas de ganancias consolidadas transversales
    const gananciasResult = await container.administracion.consultarMetricasGanancias.execute({
      usuarioId: sessionContext.usuarioId,
      desde,
      hasta,
    });

    if (gananciasResult.isFailure) {
      return Result.fail(gananciasResult.error);
    }

    // 2. Obtener comparativo de rendimiento entre sedes
    const sedesResult = await container.administracion.consultarRendimientoSucursales.execute({
      usuarioId: sessionContext.usuarioId,
      desde,
      hasta,
    });

    const rendimientos = sedesResult.isSuccess ? sedesResult.value : [];
    const metricas = gananciasResult.value;

    return Result.ok({
      periodo: args.periodo,
      rangoFechas: {
        desde: desde ? desde.toISOString().split('T')[0] : undefined,
        hasta: hasta ? hasta.toISOString().split('T')[0] : undefined,
      },
      consolidadoCorporativo: {
        ingresosTotales: metricas.ingresosTotales,
        costoTotal: metricas.costoTotal,
        gananciaNeta: metricas.gananciaNeta,
        margenPorcentaje: metricas.margenPorcentaje,
        totalFacturas: metricas.totalFacturas,
        ticketPromedio: metricas.ticketPromedio,
      },
      rendimientoPorSede: rendimientos.map((r) => ({
        sucursalId: r.sucursalId,
        nombreSucursal: r.nombreSucursal,
        totalVentas: r.totalVentas,
        totalFacturas: r.totalFacturas,
        ticketPromedio: r.ticketPromedio,
        gananciaNeta: r.gananciaNeta,
      })),
    });
  },

  formateador: (rep: ReporteMetricasGlobalesMcp): string => {
    const c = rep.consolidadoCorporativo;

    const lineas = [
      `### 💼 Informe Ejecutivo Financiero Consolidado (${rep.periodo.toUpperCase()})\n`,
      `**Período:** ${rep.rangoFechas.desde ?? 'Histórico'} al ${rep.rangoFechas.hasta ?? 'Presente'}\n`,
      '#### 📈 Métricas Corporativas:',
      `- **Ingresos Brutos:** $${c.ingresosTotales.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
      `- **Costo Total de Ventas:** $${c.costoTotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
      `- **Ganancia Neta Consolidada:** $${c.gananciaNeta.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
      `- **Margen de Rentabilidad:** ${c.margenPorcentaje.toFixed(2)}%`,
      `- **Volumen de Facturas:** ${c.totalFacturas} comprobantes`,
      `- **Ticket Promedio:** $${c.ticketPromedio.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
      '',
    ];

    if (rep.rendimientoPorSede.length > 0) {
      lineas.push('#### 🏢 Rendimiento por Sede Operativa:');
      for (const sede of rep.rendimientoPorSede) {
        lineas.push(
          `- **${sede.nombreSucursal} (ID: ${sede.sucursalId}):**`,
          `  - Ventas: $${sede.totalVentas.toLocaleString('es-CO', { minimumFractionDigits: 2 })} | Facturas: ${sede.totalFacturas}`,
          `  - Ticket Promedio: $${sede.ticketPromedio.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
          `  - Ganancia Neta: $${sede.gananciaNeta.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
        );
      }
    }

    return lineas.join('\n');
  },
};
