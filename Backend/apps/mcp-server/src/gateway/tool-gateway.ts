import { z } from 'zod';
import { DomainError, Result } from '@warengine/shared-kernel';
import type { AppContainer } from '@warengine/composition';
import type { McpSessionContext } from '../session/index.ts';
import {
  McpPresenterResponse,
  presentMcpResult,
} from '../presenters/index.ts';

export interface ParametrosEjecucionGateway<TArgs, TResult> {
  toolName: string;
  permisoRequerido: string;
  schema?: z.ZodType<TArgs>;
  args: unknown;
  sessionContext: McpSessionContext;
  container: AppContainer;
  handler: (
    argsValidados: TArgs,
    sessionContext: McpSessionContext,
  ) => Promise<Result<TResult, DomainError>>;
  formateador?: (valor: TResult) => string;
}

/**
 * McpAuthorizationGateway — Componente central de autorización y gobernanza (Regla 6 ADR 0001).
 *
 * Responsabilidades:
 *  1. Fail-Fast Authorization (RF-SA-I6): Verifica permisos antes de invocar la lógica del Core.
 *  2. Forzado de Alcance de Sede (RF-SA-I4): Asegura que usuarios de sucursal no consulten datos de otras sedes.
 *  3. Validación de Parámetros con Zod (RF-SA-I10): Evita entradas corruptas o inyecciones de datos.
 *  4. Telemetría Forense (RF-SA-I9): Registra toda llamada en la tabla logs_mcp_tools.
 *  5. Serialización Segura (RF-SA-I8 / RF-SA-I12): Oculta detalles técnicos ante errores o denegaciones.
 */
export class McpAuthorizationGateway {
  public static async procesarTool<TArgs, TResult>(
    params: ParametrosEjecucionGateway<TArgs, TResult>,
  ): Promise<McpPresenterResponse> {
    const inicio = performance.now();
    const {
      toolName,
      permisoRequerido,
      schema,
      args,
      sessionContext,
      container,
      handler,
      formateador,
    } = params;

    // ─── 1. Verificación de Permisos (Fail-Fast: RF-SA-I6) ───────────────────
    const tienePermiso = sessionContext.permisos.includes(permisoRequerido);

    if (!tienePermiso) {
      const duracionMs = Math.round(performance.now() - inicio);

      // Auditoría de acceso denegado
      await container.mcp.registrarLog.execute({
        toolName,
        usuarioId: sessionContext.usuarioId,
        sucursalId: sessionContext.sucursalId,
        parametros: typeof args === 'object' && args !== null ? (args as Record<string, unknown>) : null,
        exitoso: false,
        duracionMs,
        error: 'PERMISO_DENEGADO',
      });

      // Mensaje neutro sin revelar la matriz de permisos de la plataforma (RF-SA-I12)
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'No tienes los permisos necesarios para realizar esta consulta u operación en el sistema.',
          },
        ],
      };
    }

    // ─── 2. Validación de Parámetros con Zod (RF-SA-I10) ─────────────────────
    let argsValidados: TArgs;

    if (schema) {
      const parseResult = schema.safeParse(args);

      if (!parseResult.success) {
        const duracionMs = Math.round(performance.now() - inicio);
        const detalleErrores = parseResult.error.errors.map((e) => e.message).join('. ');

        // Auditoría de parámetros corruptos o inválidos
        await container.mcp.registrarLog.execute({
          toolName,
          usuarioId: sessionContext.usuarioId,
          sucursalId: sessionContext.sucursalId,
          parametros: typeof args === 'object' && args !== null ? (args as Record<string, unknown>) : null,
          exitoso: false,
          duracionMs,
          error: 'PARAMETROS_INVALIDOS',
        });

        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Los parámetros enviados para '${toolName}' son inválidos: ${detalleErrores}`,
            },
          ],
        };
      }

      argsValidados = parseResult.data;
    } else {
      argsValidados = args as TArgs;
    }

    // ─── 3. Forzado de Alcance de Sucursal (Anti-Bypass: RF-SA-I4) ───────────
    // Si el usuario no tiene alcance global (no es SuperAdmin), forzamos su sede
    if (!sessionContext.esGlobal && typeof argsValidados === 'object' && argsValidados !== null) {
      if ('sucursalId' in argsValidados || sessionContext.sucursalId !== null) {
        (argsValidados as Record<string, unknown>)['sucursalId'] = sessionContext.sucursalId;
      }
    }

    // ─── 4. Ejecución del Caso de Uso del Core (Delegación: RF-SA-I2) ────────
    let result: Result<TResult, DomainError>;

    try {
      result = await handler(argsValidados, sessionContext);
    } catch (error) {
      const duracionMs = Math.round(performance.now() - inicio);
      console.error(`[MCP-GATEWAY-HANDLER-ERROR] Error catastrófico en Tool '${toolName}':`, error);

      await container.mcp.registrarLog.execute({
        toolName,
        usuarioId: sessionContext.usuarioId,
        sucursalId: sessionContext.sucursalId,
        parametros: typeof argsValidados === 'object' && argsValidados !== null
          ? (argsValidados as Record<string, unknown>)
          : null,
        exitoso: false,
        duracionMs,
        error: 'ERROR_INTERNO_HANDLER',
      });

      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Ocurrió un error inesperado al procesar la herramienta en el servidor.',
          },
        ],
      };
    }

    const duracionMs = Math.round(performance.now() - inicio);

    // ─── 5. Auditoría Forense de Ejecución (RF-SA-I9) ─────────────────────────
    await container.mcp.registrarLog.execute({
      toolName,
      usuarioId: sessionContext.usuarioId,
      sucursalId: sessionContext.sucursalId,
      parametros: typeof argsValidados === 'object' && argsValidados !== null
        ? (argsValidados as Record<string, unknown>)
        : null,
      exitoso: result.isSuccess,
      duracionMs,
      error: result.isFailure ? result.error.code : null,
    });

    // ─── 6. Presentación del Resultado (RF-SA-I8 / Presenter) ────────────────
    return presentMcpResult(result, formateador);
  }
}
