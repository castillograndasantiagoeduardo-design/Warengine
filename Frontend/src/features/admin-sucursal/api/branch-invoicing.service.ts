/**
 * branch-invoicing.service.ts — Implementación del servicio de supervisión de facturas y alertas.
 * 
 * Principios SOLID:
 * - Single Responsibility Principle (SRP): Consulta y anulación atómica de facturación y resolución de alertas.
 * - Dependency Inversion Principle (DIP): Inyecta IHttpClient desacoplando la capa de transporte HTTP.
 */

import { IHttpClient, apiClient } from '@/lib/api';
import type { IBranchInvoicingService } from './branch-invoicing.interface';
import type {
  FacturaSede,
  AlertaOperativa,
  FiltrosFacturasSede,
  FiltrosAlertasSede,
} from '../types/branch-invoicing.types';

export class BranchInvoicingService implements IBranchInvoicingService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  private formatCOP(num: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);
  }

  private mapFactura(f: any): FacturaSede {
    const total = Number(f.total || 0);
    const subtotal = Number(f.subtotal || 0);
    const iva = Number(f.iva || 0);
    const fechaObj = f.fecha ? new Date(f.fecha) : new Date();

    const consecutivo = Number(f.consecutivo || 1);
    const folioFormateado = `#FAC-${String(consecutivo).padStart(4, '0')}`;

    const fechaFormateada = fechaObj.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const items = (f.items || []).map((it: any) => ({
      id: String(it.id),
      productoId: String(it.productoId || it.producto_id),
      productoNombre: it.productoNombre || 'Producto en catálogo',
      cantidad: Number(it.cantidad || 1),
      precioUnitario: Number(it.precioUnitario ?? it.precio_unitario ?? 0),
      descuento: Number(it.descuento || 0),
      subtotal: Number(it.subtotal || 0),
    }));

    const pagos = (f.pagos || []).map((p: any) => ({
      id: String(p.id),
      medioPago: p.medioPago || p.medio_pago || 'efectivo',
      monto: Number(p.monto || 0),
      referenciaTransaccion: p.referenciaTransaccion || p.referencia_transaccion || null,
      fecha: p.fecha || '',
    }));

    return {
      id: String(f.id),
      consecutivo,
      folioFormateado,
      clienteId: String(f.clienteId || f.cliente_id || ''),
      clienteNombre: f.clienteNombre || 'Consumidor Final',
      clienteDocumento: f.clienteDocumento || '2222222222',
      usuarioId: String(f.usuarioId || f.usuario_id || ''),
      cajeroNombre: f.cajeroNombre || 'Cajero de Turno',
      sucursalId: Number(f.sucursalId || f.sucursal_id || 1),
      turnoCajaId: f.turnoCajaId ? String(f.turnoCajaId) : null,
      subtotal,
      iva,
      total,
      totalFormateado: this.formatCOP(total),
      estado: (f.estado === 'anulada') ? 'anulada' : 'emitida',
      fecha: f.fecha || fechaObj.toISOString(),
      fechaFormateada,
      items,
      pagos,
    };
  }

  public async listarFacturas(
    sucursalId: number,
    filtros?: FiltrosFacturasSede,
  ): Promise<FacturaSede[]> {
    const params: Record<string, any> = { sucursalId, limite: 100 };
    if (filtros?.estado) params.estado = filtros.estado;
    if (filtros?.clienteId) params.clienteId = filtros.clienteId;
    if (filtros?.fechaInicio) params.fechaInicio = filtros.fechaInicio;
    if (filtros?.fechaFin) params.fechaFin = filtros.fechaFin;

    const res = await this.http.get<any>('/ventas/facturas', { params });
    const list = Array.isArray(res) ? res : res?.items || [];
    return list.map((f: any) => this.mapFactura(f));
  }

  public async obtenerFacturaPorId(id: string): Promise<FacturaSede> {
    const res = await this.http.get<any>(`/ventas/facturas/${id}`);
    return this.mapFactura(res);
  }

  public async anularFactura(
    id: string,
    motivo: string,
  ): Promise<{ mensaje: string; factura: FacturaSede }> {
    const res = await this.http.post<any>(`/ventas/facturas/${id}/anular`, {
      motivo: motivo.trim(),
    });
    return {
      mensaje: res?.mensaje || 'Factura anulada con éxito. Stock reingresado.',
      factura: this.mapFactura(res?.factura || res),
    };
  }

  public async listarAlertas(
    sucursalId: number,
    filtros?: FiltrosAlertasSede,
  ): Promise<AlertaOperativa[]> {
    const params: Record<string, any> = { sucursalId };
    if (filtros?.estado) params.estado = filtros.estado;
    if (filtros?.prioridad) params.prioridad = filtros.prioridad;

    const res = await this.http.get<any>('/administracion/alertas', { params });
    const list = Array.isArray(res) ? res : res?.items || [];

    return list.map((a: any) => ({
      id: String(a.id),
      sucursalId: Number(a.sucursalId || a.sucursal_id || sucursalId),
      sucursalNombre: a.sucursalNombre || 'Sede Principal',
      usuarioId: String(a.usuarioId || a.usuario_id || ''),
      usuarioEmail: a.usuarioEmail || null,
      usuarioNombre: a.usuarioNombre || a.usuarioEmail || 'Cajero Operativo',
      motivo: a.motivo || 'Alerta de Mostrador',
      prioridad: (a.prioridad === 'urgente') ? 'urgente' : 'normal',
      descripcion: a.descripcion || null,
      estado: (a.estado === 'atendido' ? 'atendido' : a.estado === 'visto' ? 'visto' : 'pendiente'),
      fechaCreacion: a.fechaCreacion || a.created_at || new Date().toISOString(),
      fechaAtencion: a.fechaAtencion || null,
    }));
  }

  public async cambiarEstadoAlerta(
    id: string,
    estado: 'visto' | 'atendido',
  ): Promise<AlertaOperativa> {
    const res = await this.http.put<any>(`/administracion/alertas/${id}/estado`, {
      estado,
    });
    return {
      id: String(res.id || id),
      sucursalId: Number(res.sucursalId || 1),
      sucursalNombre: res.sucursalNombre,
      usuarioId: String(res.usuarioId || ''),
      usuarioEmail: res.usuarioEmail,
      usuarioNombre: res.usuarioNombre || 'Cajero Operativo',
      motivo: res.motivo || 'Alerta Operativa',
      prioridad: res.prioridad || 'normal',
      descripcion: res.descripcion || null,
      estado: res.estado || estado,
      fechaCreacion: res.fechaCreacion || new Date().toISOString(),
      fechaAtencion: res.fechaAtencion || null,
    };
  }
}

export const branchInvoicingService = new BranchInvoicingService();
