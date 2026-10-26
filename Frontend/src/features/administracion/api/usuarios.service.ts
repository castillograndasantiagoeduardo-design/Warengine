/**
 * usuarios.service.ts — Gestión de cuentas de usuario y roles (RF-ADM-C5 a C10, C16).
 *
 * GET /administracion/usuarios es paginado: { items, total, pagina, limite, totalPaginas }.
 * Se normaliza a Paginado<T> para que encaje con useListado y DataTable.
 */

import type {
  AsignarSucursalesInput,
  CrearUsuarioInput,
  FiltrosUsuariosQuery,
  RolResumenDto,
} from '@warengine/contracts';
import { IHttpClient, apiClient } from '@/lib/api';
import { normalizarPaginado, type Paginado, type RespuestaListado } from '@/lib/types/paginacion';
import type { SucursalesDeUsuario, UsuarioGestionado } from '../types';

export interface IUsuariosService {
  listar(filtros?: FiltrosUsuariosQuery): Promise<Paginado<UsuarioGestionado>>;
  crear(input: CrearUsuarioInput): Promise<UsuarioGestionado>;
  cambiarRol(id: string, rolId: number): Promise<UsuarioGestionado>;
  cambiarEstado(id: string, isActive: boolean): Promise<UsuarioGestionado>;
  restablecerPassword(id: string, nuevaPassword: string): Promise<void>;
  obtenerSucursales(id: string): Promise<SucursalesDeUsuario>;
  asignarSucursales(id: string, input: AsignarSucursalesInput): Promise<void>;
  listarRoles(): Promise<RolResumenDto[]>;
}

const BASE = '/administracion/usuarios';

export class UsuariosService implements IUsuariosService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  public async listar(filtros: FiltrosUsuariosQuery = {}): Promise<Paginado<UsuarioGestionado>> {
    const res = await this.http.get<RespuestaListado<UsuarioGestionado>>(BASE, { params: { ...filtros } });
    return normalizarPaginado(res);
  }

  /** Crea empleado + cuenta de forma atómica (RF-ADM-C6). */
  public crear(input: CrearUsuarioInput): Promise<UsuarioGestionado> {
    return this.http.post<UsuarioGestionado>(BASE, input);
  }

  public cambiarRol(id: string, rolId: number): Promise<UsuarioGestionado> {
    return this.http.put<UsuarioGestionado>(`${BASE}/${id}/rol`, { rolId });
  }

  public cambiarEstado(id: string, isActive: boolean): Promise<UsuarioGestionado> {
    return this.http.put<UsuarioGestionado>(`${BASE}/${id}/estado`, { isActive });
  }

  public async restablecerPassword(id: string, nuevaPassword: string): Promise<void> {
    await this.http.put(`${BASE}/${id}/password`, { nuevaPassword });
  }

  public obtenerSucursales(id: string): Promise<SucursalesDeUsuario> {
    return this.http.get<SucursalesDeUsuario>(`${BASE}/${id}/sucursales`);
  }

  public async asignarSucursales(id: string, input: AsignarSucursalesInput): Promise<void> {
    await this.http.put(`${BASE}/${id}/sucursales`, input);
  }

  /** GET /administracion/roles (permiso autenticacion:asignar-roles). */
  public listarRoles(): Promise<RolResumenDto[]> {
    return this.http.get<RolResumenDto[]>('/administracion/roles');
  }
}

export const usuariosService = new UsuariosService();
