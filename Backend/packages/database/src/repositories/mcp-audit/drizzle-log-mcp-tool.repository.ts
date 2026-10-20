import { and, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import { Database } from '../../client.ts';
import { logs_mcp_tools } from '../../schema/auditoria.schema.ts';
import { usuarios } from '../../schema/autenticacion.schema.ts';
import { empleados, sucursales } from '../../schema/administracion.schema.ts';
import {
  FiltrosLogsMcpTools,
  ILogMcpToolRepository,
  PaginaLogsMcpTools,
  RegistroLogMcpTool,
} from '@warengine/core';
import { logMcpToolFromRow } from '../../mappers/mcp-audit/log-mcp-tool.mapper.ts';

/**
 * DrizzleLogMcpToolRepository — Implementación de persistencia para logs de herramientas MCP.
 * Registra y consulta la bitácora forense de la tabla `logs_mcp_tools` en MySQL.
 */
export class DrizzleLogMcpToolRepository implements ILogMcpToolRepository {
  constructor(private readonly db: Database) {}

  /**
   * Inserta un registro de invocación de Tool MCP.
   * En caso de error de red o base de datos, no interrumpe el flujo pero lo reporta a stderr.
   */
  public async registrar(registro: RegistroLogMcpTool): Promise<void> {
    try {
      await this.db.insert(logs_mcp_tools).values({
        tool_name: registro.toolName,
        usuario_id: registro.usuarioId,
        sucursal_id: registro.sucursalId,
        parametros: registro.parametros ?? null,
        exitoso: registro.exitoso,
        duracion_ms: registro.duracionMs,
        error: registro.error ?? null,
      });
    } catch (error) {
      console.error(
        `[MCP-LOG-PERSISTENCIA] Error al insertar en logs_mcp_tools para tool=${registro.toolName}:`,
        error,
      );
    }
  }

  /**
   * Consulta la bitácora de ejecuciones MCP aplicando filtros opcionales de usuario,
   * nombre de herramienta, éxito/falla y rango temporal.
   */
  public async listar(filtros: FiltrosLogsMcpTools): Promise<PaginaLogsMcpTools> {
    const condiciones: SQL[] = [];

    if (filtros.usuarioId) {
      condiciones.push(eq(logs_mcp_tools.usuario_id, filtros.usuarioId));
    }
    if (filtros.toolName) {
      condiciones.push(eq(logs_mcp_tools.tool_name, filtros.toolName));
    }
    if (typeof filtros.exitoso === 'boolean') {
      condiciones.push(eq(logs_mcp_tools.exitoso, filtros.exitoso));
    }
    if (filtros.desde) {
      condiciones.push(gte(logs_mcp_tools.fecha, filtros.desde));
    }
    if (filtros.hasta) {
      condiciones.push(lte(logs_mcp_tools.fecha, filtros.hasta));
    }

    const where = condiciones.length > 0 ? and(...condiciones) : undefined;

    const rows = await this.db
      .select({
        id: logs_mcp_tools.id_log_mcp_tool,
        toolName: logs_mcp_tools.tool_name,
        usuarioId: logs_mcp_tools.usuario_id,
        usuarioNombre: empleados.nombre,
        sucursalId: logs_mcp_tools.sucursal_id,
        sucursalNombre: sucursales.nombre,
        parametros: logs_mcp_tools.parametros,
        exitoso: logs_mcp_tools.exitoso,
        duracionMs: logs_mcp_tools.duracion_ms,
        error: logs_mcp_tools.error,
        fecha: logs_mcp_tools.fecha,
      })
      .from(logs_mcp_tools)
      .leftJoin(usuarios, eq(logs_mcp_tools.usuario_id, usuarios.id_usuario))
      .leftJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
      .leftJoin(sucursales, eq(logs_mcp_tools.sucursal_id, sucursales.id_sucursal))
      .where(where)
      .orderBy(desc(logs_mcp_tools.fecha), desc(logs_mcp_tools.id_log_mcp_tool))
      .limit(filtros.limite)
      .offset(filtros.offset);

    const [filaTotal] = await this.db
      .select({ total: count() })
      .from(logs_mcp_tools)
      .where(where);

    return {
      items: rows.map(logMcpToolFromRow),
      total: Number(filaTotal?.total ?? 0),
    };
  }
}
