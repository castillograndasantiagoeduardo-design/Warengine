/**
 * usuarios.service.ts — Directorio de usuarios (RF-ADM-C5, C16).
 *
 * GET /administracion/usuarios es paginado: { items, total, pagina, limite, totalPaginas }.
 * Se normaliza a Paginado<T> para que encaje con useListado y DataTable.
 */

import type { FiltrosUsuariosQuery } from '@warengine/contracts';
import { IHttpClient, apiClient } from '@/lib/api';
import { normalizarPaginado, type Paginado, type RespuestaListado } from '@/lib/types/paginacion';
import type { UsuarioGestionado } from '../types';

export interface IUsuariosService {
  listar(filtros?: FiltrosUsuariosQuery): Promise<Paginado<UsuarioGestionado>>;
}

export class UsuariosService implements IUsuariosService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  public async listar(filtros: FiltrosUsuariosQuery = {}): Promise<Paginado<UsuarioGestionado>> {
    const res = await this.http.get<RespuestaListado<UsuarioGestionado>>('/administracion/usuarios', {
      params: { ...filtros },
    });
    return normalizarPaginado(res);
  }
}

export const usuariosService = new UsuariosService();
