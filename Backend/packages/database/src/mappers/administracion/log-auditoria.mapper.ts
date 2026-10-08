import { LogAuditoria } from '@warengine/core';

export interface FilaLogAuditoria {
  id: string;
  usuarioId: string | null;
  usuarioNombre: string | null;
  accion: string;
  entidad: string;
  entidadId: string | null;
  detalles: unknown;
  ip: string | null;
  fecha: Date;
}

/** La columna JSON puede traer cualquier cosa: solo se aceptan objetos. */
function comoObjeto(valor: unknown): Record<string, unknown> | null {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : null;
}

export function logAuditoriaFromRow(row: FilaLogAuditoria): LogAuditoria {
  return new LogAuditoria(
    row.id,
    row.usuarioId,
    row.usuarioNombre,
    row.accion,
    row.entidad,
    row.entidadId,
    comoObjeto(row.detalles),
    row.ip,
    row.fecha,
  );
}