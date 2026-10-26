/**
 * auditoria.service.ts — Bitácora inmutable de auditoría (RF-ADM-C11, C19, C20).
 *
 * GET /administracion/auditoria           → { items, total, pagina, limite, totalPaginas }
 * GET /administracion/auditoria/exportar  → text/csv (descarga)
 */

import { IHttpClient, apiClient } from '@/lib/api';
import { normalizarPaginado, type Paginado, type RespuestaListado } from '@/lib/types/paginacion';
import type { FiltrosAuditoria, LogAuditoria } from '../types';

export interface IAuditoriaService {
  consultar(filtros: FiltrosAuditoria & { pagina: number; limite: number }): Promise<Paginado<LogAuditoria>>;
  exportarCsv(filtros: FiltrosAuditoria): Promise<string>;
}

const BASE = '/administracion/auditoria';

export class AuditoriaService implements IAuditoriaService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  public async consultar(filtros: FiltrosAuditoria & { pagina: number; limite: number }): Promise<Paginado<LogAuditoria>> {
    const res = await this.http.get<RespuestaListado<LogAuditoria>>(BASE, { params: { ...filtros } });
    return normalizarPaginado(res);
  }

  /** Devuelve el CSV como texto (el cliente HTTP entrega text/csv sin parsear). */
  public exportarCsv(filtros: FiltrosAuditoria): Promise<string> {
    return this.http.get<string>(`${BASE}/exportar`, { params: { ...filtros, formato: 'csv' } });
  }
}

export const auditoriaService = new AuditoriaService();
