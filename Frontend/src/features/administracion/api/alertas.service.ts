/**
 * alertas.service.ts — Alertas administrativas (RF-ADM-C15) y de stock (RF-ADM-A6).
 *
 * GET /administracion/alertas              → AlertaAdmin[] (alcance por sucursal en backend)
 * PUT /administracion/alertas/:id/estado   ← { estado: 'visto' | 'atendido' }
 * GET /administracion/alertas-stock        → { items, total, page, limit, totalPages }
 */

import type { ListarAlertasAdminQuery } from '@warengine/contracts';
import { IHttpClient, apiClient } from '@/lib/api';
import { normalizarPaginado, type Paginado, type RespuestaListado } from '@/lib/types/paginacion';
import type { AlertaAdmin, AlertaStock } from '../types';

export interface IAlertasService {
  listar(filtros?: Partial<ListarAlertasAdminQuery>): Promise<AlertaAdmin[]>;
  cambiarEstado(id: string, estado: 'visto' | 'atendido'): Promise<AlertaAdmin>;
  listarStock(filtros: { page: number; limit: number; sucursalId?: number }): Promise<Paginado<AlertaStock>>;
}

export class AlertasService implements IAlertasService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  public listar(filtros: Partial<ListarAlertasAdminQuery> = {}): Promise<AlertaAdmin[]> {
    return this.http.get<AlertaAdmin[]>('/administracion/alertas', { params: { ...filtros } });
  }

  public cambiarEstado(id: string, estado: 'visto' | 'atendido'): Promise<AlertaAdmin> {
    return this.http.put<AlertaAdmin>(`/administracion/alertas/${id}/estado`, { estado });
  }

  public async listarStock(filtros: { page: number; limit: number; sucursalId?: number }): Promise<Paginado<AlertaStock>> {
    const res = await this.http.get<RespuestaListado<AlertaStock>>('/administracion/alertas-stock', { params: { ...filtros } });
    return normalizarPaginado(res);
  }
}

export const alertasService = new AlertasService();
