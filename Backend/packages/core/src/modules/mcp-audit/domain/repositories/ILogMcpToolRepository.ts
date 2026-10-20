import { LogMcpTool } from '../entities/LogMcpTool.ts';

/**
 * Parámetros requeridos para insertar un registro de auditoría de Tool MCP.
 */
export interface RegistroLogMcpTool {
  toolName: string;
  usuarioId: string | null;
  sucursalId: number | null;
  parametros?: Record<string, unknown> | null;
  exitoso: boolean;
  duracionMs: number;
  error?: string | null;
}

/**
 * Criterios de filtrado para consultar la bitácora de Tools del MCP.
 */
export interface FiltrosLogsMcpTools {
  usuarioId?: string;
  toolName?: string;
  exitoso?: boolean;
  desde?: Date;
  hasta?: Date;
  limite: number;
  offset: number;
}

/**
 * Resultado paginado de logs de Tools MCP.
 */
export interface PaginaLogsMcpTools {
  items: LogMcpTool[];
  total: number;
}

/**
 * ILogMcpToolRepository — Puerto de persistencia para la auditoría de MCP.
 * Desacopla la lógica de negocio y de aplicación de la base de datos MySQL (DIP).
 */
export interface ILogMcpToolRepository {
  /**
   * Persiste una entrada de log tras la invocación de una Tool.
   * Si la BD falla, no debe interrumpir el flujo del usuario pero debe registrarse en consola.
   */
  registrar(registro: RegistroLogMcpTool): Promise<void>;

  /**
   * Obtiene una lista paginada de logs según los filtros aplicados.
   */
  listar(filtros: FiltrosLogsMcpTools): Promise<PaginaLogsMcpTools>;
}
