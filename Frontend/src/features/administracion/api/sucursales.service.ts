/**
 * sucursales.service.ts — Gestión de sucursales (RF-ADM-C1, C2, C3, C17, C18).
 */

import { IHttpClient, apiClient } from '@/lib/api';
import type { CrearSucursalInput, EditarSucursalInput, Sucursal, SucursalDetalle } from '../types';

export interface ISucursalesService {
  listar(): Promise<Sucursal[]>;
  obtenerDetalle(id: number): Promise<SucursalDetalle>;
  crear(input: CrearSucursalInput): Promise<Sucursal>;
  editar(id: number, input: EditarSucursalInput): Promise<Sucursal>;
  cambiarEstado(id: number, isActive: boolean): Promise<Sucursal>;
}

const BASE = '/administracion/sucursales';

export class SucursalesService implements ISucursalesService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  public listar(): Promise<Sucursal[]> {
    return this.http.get<Sucursal[]>(BASE);
  }

  public obtenerDetalle(id: number): Promise<SucursalDetalle> {
    return this.http.get<SucursalDetalle>(`${BASE}/${id}/detalle`);
  }

  public crear(input: CrearSucursalInput): Promise<Sucursal> {
    return this.http.post<Sucursal>(BASE, input);
  }

  public editar(id: number, input: EditarSucursalInput): Promise<Sucursal> {
    return this.http.put<Sucursal>(`${BASE}/${id}`, input);
  }

  public cambiarEstado(id: number, isActive: boolean): Promise<Sucursal> {
    return this.http.put<Sucursal>(`${BASE}/${id}/estado`, { isActive });
  }
}

export const sucursalesService = new SucursalesService();
