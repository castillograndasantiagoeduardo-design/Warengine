/**
 * areas.service.ts — Áreas organizativas por sucursal (RF-ADM-C13).
 */

import { IHttpClient, apiClient } from '@/lib/api';
import type { Area, CrearAreaInput, EditarAreaInput } from '../types';

export interface IAreasService {
  listarPorSucursal(sucursalId: number): Promise<Area[]>;
  crear(sucursalId: number, input: CrearAreaInput): Promise<Area>;
  editar(id: number, input: EditarAreaInput): Promise<Area>;
  eliminar(id: number): Promise<void>;
}

export class AreasService implements IAreasService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  public listarPorSucursal(sucursalId: number): Promise<Area[]> {
    return this.http.get<Area[]>(`/administracion/sucursales/${sucursalId}/areas`);
  }

  public crear(sucursalId: number, input: CrearAreaInput): Promise<Area> {
    return this.http.post<Area>(`/administracion/sucursales/${sucursalId}/areas`, input);
  }

  public editar(id: number, input: EditarAreaInput): Promise<Area> {
    return this.http.put<Area>(`/administracion/areas/${id}`, input);
  }

  public async eliminar(id: number): Promise<void> {
    await this.http.delete(`/administracion/areas/${id}`);
  }
}

export const areasService = new AreasService();
