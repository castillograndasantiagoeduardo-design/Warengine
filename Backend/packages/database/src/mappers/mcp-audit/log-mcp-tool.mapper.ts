import { LogMcpTool } from '@warengine/core';

export interface FilaLogMcpTool {
  id: number;
  toolName: string;
  usuarioId: string | null;
  usuarioNombre?: string | null;
  sucursalId: number | null;
  sucursalNombre?: string | null;
  parametros: unknown;
  exitoso: boolean | number;
  duracionMs: number;
  error: string | null;
  fecha: Date;
}

/**
 * Convierte un valor genérico o JSON de base de datos a un objeto record seguro.
 */
function comoObjeto(valor: unknown): Record<string, unknown> | null {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : null;
}

/**
 * Mapea una fila leída desde MySQL al modelo de dominio LogMcpTool.
 */
export function logMcpToolFromRow(row: FilaLogMcpTool): LogMcpTool {
  return new LogMcpTool({
    id: row.id,
    toolName: row.toolName,
    usuarioId: row.usuarioId,
    usuarioNombre: row.usuarioNombre ?? null,
    sucursalId: row.sucursalId,
    sucursalNombre: row.sucursalNombre ?? null,
    parametros: comoObjeto(row.parametros),
    exitoso: Boolean(row.exitoso),
    duracionMs: row.duracionMs,
    error: row.error,
    fecha: row.fecha,
  });
}
