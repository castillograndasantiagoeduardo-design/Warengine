import { apiFetch } from '@/lib/api-client';

export interface AlertaStockItem {
  productoId: string;
  sku: string;
  nombre: string;
  sucursalId: number;
  sucursalNombre: string;
  stockActual: number;
  stockMinimo: number;
  faltante: number;
}

export interface AlertaStockResponse {
  items: AlertaStockItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AlertaAdminItem {
  id: string | number;
  sucursalId: number;
  nombreSucursal?: string;
  motivo: string;
  descripcion?: string;
  prioridad: 'urgente' | 'normal';
  estado: 'pendiente' | 'visto' | 'atendido';
  fechaCreacion: string;
}

export async function fetchAlertasStock() {
  return apiFetch<AlertaStockResponse>('/administracion/alertas-stock');
}

export async function fetchAlertasAdmin(params?: { sucursalId?: number; estado?: string }) {
  return apiFetch<AlertaAdminItem[]>('/administracion/alertas', { params });
}

export async function cambiarEstadoAlerta(id: string | number, estado: 'pendiente' | 'visto' | 'atendido') {
  return apiFetch<void>(`/administracion/alertas/${id}/estado`, {
    method: 'PUT',
    body: JSON.stringify({ estado }),
  });
}
