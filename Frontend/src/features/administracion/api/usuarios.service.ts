/**
 * usuarios.service.ts — Directorio de usuarios (RF-ADM-C5).
 *
 * Por ahora solo lectura (KPI de usuarios activos). La gestión completa
 * (crear, rol, estado, contraseña, multisede) queda para el módulo de Usuarios.
 */

import type { FiltrosUsuariosInput } from '@warengine/contracts';
import { IHttpClient, apiClient } from '@/lib/api';
import type { UsuarioGestionado } from '../types';

export interface IUsuariosService {
  listar(filtros?: FiltrosUsuariosInput): Promise<UsuarioGestionado[]>;
}

export class UsuariosService implements IUsuariosService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  public listar(filtros: FiltrosUsuariosInput = {}): Promise<UsuarioGestionado[]> {
    return this.http.get<UsuarioGestionado[]>('/administracion/usuarios', { params: { ...filtros } });
  }
}

export const usuariosService = new UsuariosService();
