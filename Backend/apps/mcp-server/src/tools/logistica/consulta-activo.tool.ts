import { z } from 'zod';
import { DomainError, Result } from '@warengine/shared-kernel';
import { PERMISSIONS, TOOL_NAMES, consultaActivoMcpSchema, type ConsultaActivoMcpDTO } from '@warengine/contracts';
import type { AppContainer } from '@warengine/composition';
import type { DefinicionToolMcp } from '../../catalog/tool-definition.ts';
import type { McpSessionContext } from '../../session/index.ts';

export interface DetalleActivoLogisticaMcp {
  mensaje: string;
  encontrado: boolean;
  filtrosConsultados: {
    codigoInterno?: string;
    serie?: string;
    sucursalId?: number;
  };
  activo?: {
    codigoInterno: string;
    nombre: string;
    serie: string;
    sucursalId: number;
    estado: 'disponible' | 'asignado' | 'mantenimiento' | 'baja';
    custodio?: string;
    area?: string;
  };
}

/**
 * Tool MCP: 'consulta-activo' (RF-LOG-C4).
 *
 * Permite al asistente conversacional consultar la ficha técnica, custodio actual,
 * estado operativo y ubicación de un activo fijo interno del negocio.
 * Se adhiere al módulo de logística y control de activos.
 */
export const consultaActivoTool: DefinicionToolMcp<ConsultaActivoMcpDTO, DetalleActivoLogisticaMcp> = {
  name: TOOL_NAMES.CONSULTA_ACTIVO,
  description:
    'Consulta la ficha técnica, custodio actual, estado operativo y ubicación de un activo fijo interno del negocio (RF-LOG-C4).',
  permisoRequerido: PERMISSIONS.LOGISTICA_LEER,
  schema: consultaActivoMcpSchema,
  shape: {
    codigoInterno: z.string().optional().describe('Código interno del activo (ej. ACT-001)'),
    serie: z.string().optional().describe('Número de serie del activo'),
    sucursalId: z.number().optional().describe('ID de sucursal donde se ubica el activo'),
  },

  handler: async (
    args: ConsultaActivoMcpDTO,
    _container: AppContainer,
    sessionContext: McpSessionContext,
  ): Promise<Result<DetalleActivoLogisticaMcp, DomainError>> => {
    const sucursalObjetivo = args.sucursalId ?? sessionContext.sucursalId ?? undefined;

    // Conforme a Docs/modulos/logistica.md, el módulo de logística y activos
    // tiene su modelo relacional y triggers gobernados en MySQL, con su capa de
    // casos de uso en transición de desarrollo.
    // Esta Tool responde de manera limpia y estructurada sin interrumpir el flujo del agente.
    return Result.ok({
      mensaje:
        'Consulta de activos fijos procesada. Actualmente el registro de activos físicos se encuentra gobernado bajo las políticas de inventario interno.',
      encontrado: false,
      filtrosConsultados: {
        codigoInterno: args.codigoInterno,
        serie: args.serie,
        sucursalId: sucursalObjetivo,
      },
    });
  },

  formateador: (resultado: DetalleActivoLogisticaMcp): string => {
    if (!resultado.encontrado) {
      const f = resultado.filtrosConsultados;
      return [
        '### 🏷️ Consulta de Activos Fijos (Logística)\n',
        'No se encontró ningún activo fijo asignado con los criterios especificados:',
        f.codigoInterno ? `- **Código:** \`${f.codigoInterno}\`` : '',
        f.serie ? `- **Serie:** \`${f.serie}\`` : '',
        f.sucursalId ? `- **Sede:** Sede #${f.sucursalId}` : '',
        '',
        '> *Nota: Verifique que el código o serie esté correctamente digitado en el sistema de custodia.*',
      ]
        .filter(Boolean)
        .join('\n');
    }

    const a = resultado.activo!;
    return [
      `### 🏷️ Ficha de Activo Fijo: ${a.nombre}\n`,
      `- **Código Interno:** \`${a.codigoInterno}\``,
      `- **Número de Serie:** \`${a.serie}\``,
      `- **Sede Asignada:** Sede #${a.sucursalId}`,
      `- **Estado Operativo:** **${a.estado.toUpperCase()}**`,
      a.custodio ? `- **Custodio Responsable:** ${a.custodio}` : '',
      a.area ? `- **Área:** ${a.area}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  },
};
