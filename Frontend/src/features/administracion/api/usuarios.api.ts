import { apiFetch } from '@/lib/api-client';

export interface UsuarioResponse {
  id: string;
  nombre: string;
  apellido?: string;
  email: string;
  rolId: number;
  rolNombre: string;
  sucursalId: number;
  sucursalNombre: string;
  isActive: boolean;
  sucursalesAdicionalesIds?: number[];
}

export interface CrearUsuarioRequest {
  email: string;
  password?: string;
  rolId: number;
  nombre: string;
  apellido: string;
  tipoDocumento: 'CC' | 'CE';
  numeroDocumento: string;
  sucursalId: number;
}

export async function fetchUsuarios(params?: { rolId?: number; sucursalId?: number }) {
  return apiFetch<UsuarioResponse[]>('/administracion/usuarios', { params });
}

export async function crearUsuario(data: CrearUsuarioRequest) {
  return apiFetch<UsuarioResponse>('/administracion/usuarios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function cambiarRolUsuario(usuarioId: string, rolId: number) {
  return apiFetch<void>(`/administracion/usuarios/${usuarioId}/rol`, {
    method: 'PUT',
    body: JSON.stringify({ rolId }),
  });
}

export async function cambiarEstadoUsuario(usuarioId: string, isActive: boolean) {
  return apiFetch<void>(`/administracion/usuarios/${usuarioId}/estado`, {
    method: 'PUT',
    body: JSON.stringify({ isActive }),
  });
}

export async function restablecerPasswordUsuario(usuarioId: string, nuevoPassword: string) {
  return apiFetch<void>(`/administracion/usuarios/${usuarioId}/password`, {
    method: 'PUT',
    body: JSON.stringify({ nuevoPassword }),
  });
}

export async function fetchSucursalesUsuario(usuarioId: string) {
  return apiFetch<{ sucursalPrincipalId: number; sucursalesAdicionalesIds: number[] }>(
    `/administracion/usuarios/${usuarioId}/sucursales`
  );
}

export async function asignarSucursalesUsuario(
  usuarioId: string,
  data: { sucursalPrincipalId: number; sucursalesAdicionalesIds: number[] }
) {
  return apiFetch<void>(`/administracion/usuarios/${usuarioId}/sucursales`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
