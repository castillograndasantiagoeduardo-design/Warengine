import { apiFetch } from '@/lib/api-client';

export interface AlertaStockItem {
  productoId: number;
  sku: string;
  nombreProducto: string;
  sucursalId: number;
  nombreSucursal: string;
  stockActual: number;
  stockMinimo: number;
  deficit: number;
}

export interface AlertaAdminItem {
  id: number;
  sucursalId: number;
  nombreSucursal?: string;
  tipo: string;
  mensaje: string;
  prioridad: 'urgente' | 'normal';
  atendida: boolean;
  fechaCreacion: string;
}

export async function fetchAlertasStock() {
  return apiFetch<AlertaStockItem[]>('/administracion/alertas-stock');
}

export async function fetchAlertasAdmin(params?: { sucursalId?: number; atendida?: boolean }) {
  return apiFetch<AlertaAdminItem[]>('/administracion/alertas', { params });
}

export async function cambiarEstadoAlerta(id: number, atendida: boolean) {
  return apiFetch<void>(`/administracion/alertas/${id}/estado`, {
    method: 'PUT',
    body: JSON.stringify({ atendida }),
  });
}
