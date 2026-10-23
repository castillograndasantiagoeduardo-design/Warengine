import { apiFetch } from '@/lib/api-client';

export interface SucursalResponse {
  id: number;
  nombre: string;
  direccion: string;
  telefono?: string;
  contacto?: string;
  isActive: boolean;
}

export interface SucursalDetalleResponse {
  id: number;
  nombre: string;
  direccion: string;
  contacto?: string;
  isActive: boolean;
  usuariosAsignados?: {
    id: string;
    nombre: string;
    rol: string;
    esPrincipal: boolean;
  }[];
  estadisticas?: {
    totalProductos: number;
    unidadesStock: number;
  };
  ventasRecientes?: {
    id: number;
    numeroFactura: string;
    total: number;
    fecha: string;
  }[];
}

export interface AreaResponse {
  id: number;
  sucursalId: number;
  nombre: string;
}

export async function fetchSucursales() {
  return apiFetch<SucursalResponse[]>('/administracion/sucursales');
}

export async function fetchDetalleSucursal(id: number) {
  return apiFetch<SucursalDetalleResponse>(`/administracion/sucursales/${id}/detalle`);
}

export async function crearSucursal(data: { nombre: string; direccion: string; telefono: string }) {
  return apiFetch<SucursalResponse>('/administracion/sucursales', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function editarSucursal(
  id: number,
  data: { nombre?: string; direccion?: string; telefono?: string }
) {
  return apiFetch<SucursalResponse>(`/administracion/sucursales/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function cambiarEstadoSucursal(id: number, isActive: boolean) {
  return apiFetch<void>(`/administracion/sucursales/${id}/estado`, {
    method: 'PUT',
    body: JSON.stringify({ isActive }),
  });
}

export async function fetchAreasPorSucursal(sucursalId: number) {
  return apiFetch<AreaResponse[]>(`/administracion/sucursales/${sucursalId}/areas`);
}

export async function crearArea(sucursalId: number, nombre: string) {
  return apiFetch<AreaResponse>(`/administracion/sucursales/${sucursalId}/areas`, {
    method: 'POST',
    body: JSON.stringify({ nombre }),
  });
}
