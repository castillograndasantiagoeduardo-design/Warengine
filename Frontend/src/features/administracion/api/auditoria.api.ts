import { apiFetch } from '@/lib/api-client';

export interface LogAuditoriaItem {
  id: number;
  usuarioId?: string;
  usuarioEmail?: string;
  usuarioNombre?: string;
  accion: string;
  entidad: string;
  ipOrigen?: string;
  detallesAntes?: Record<string, unknown>;
  detallesDespues?: Record<string, unknown>;
  fechaCreacion: string;
}

export interface ConsultaAuditoriaResponse {
  logs: LogAuditoriaItem[];
  total: number;
  pagina: number;
  limite: number;
}

export async function fetchAuditoria(params?: {
  usuarioId?: string;
  accion?: string;
  entidad?: string;
  desde?: string;
  hasta?: string;
  pagina?: number;
  limite?: number;
}) {
  return apiFetch<ConsultaAuditoriaResponse>('/administracion/auditoria', { params });
}

export async function exportarAuditoriaCsv(params?: {
  usuarioId?: string;
  accion?: string;
  entidad?: string;
  desde?: string;
  hasta?: string;
}) {
  return apiFetch<string>('/administracion/auditoria/exportar', { params });
}
