/**
 * branch-invoicing.service.ts — Implementación del servicio de supervisión de facturas y alertas.
 * 
 * Principios SOLID:
 * - Single Responsibility Principle (SRP): Consulta y anulación atómica de facturación, registro de devoluciones y resolución de alertas.
 * - Dependency Inversion Principle (DIP): Inyecta IHttpClient desacoplando la capa de transporte HTTP.
 */

import { IHttpClient, apiClient } from '@/lib/api';
import { formatCOP } from '@/lib/format/moneda';
import type { IBranchInvoicingService } from './branch-invoicing.interface';
import type {
  FacturaSede,
  FacturasPaginadasSede,
  AlertaOperativa,
  FiltrosFacturasSede,
  FiltrosAlertasSede,
  RegistrarDevolucionPayload,
  DevolucionItemSede,
} from '../types/branch-invoicing.types';

export class BranchInvoicingService implements IBranchInvoicingService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  private mapDevolucion(d: any): DevolucionItemSede {
    const fechaObj = d.fecha ? new Date(d.fecha) : new Date();
    const monto = Number(d.montoReembolso ?? d.monto_reembolso ?? 0);
    return {
      id: String(d.id),
      facturaId: String(d.facturaId ?? d.factura_id),
      facturaItemId: String(d.facturaItemId ?? d.factura_item_id),
      cantidad: Number(d.cantidad || 0),
      motivo: String(d.motivo || ''),
      montoReembolso: monto,
      montoReembolsoFormateado: formatCOP(monto),
      reingresaStock: Boolean(d.reingresaStock ?? d.reingresa_stock ?? true),
      usuarioId: String(d.usuarioId ?? d.usuario_id),
      sucursalId: Number(d.sucursalId ?? d.sucursal_id),
      fecha: d.fecha || fechaObj.toISOString(),
      fechaFormateada: fechaObj.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
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
      productoNombre: it.productoNombre || it.nombre || 'Producto',
      cantidad: Number(it.cantidad || 0),
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

    const devoluciones = (f.devoluciones || []).map((d: any) => this.mapDevolucion(d));

    return {
      id: String(f.id),
      consecutivo,
      folioFormateado,
      clienteId: String(f.clienteId || f.cliente_id || ''),
      clienteNombre: f.clienteNombre || 'Consumidor Final',
      clienteDocumento: f.clienteDocumento || '222222222222',
      usuarioId: String(f.usuarioId || f.usuario_id || ''),
      cajeroNombre: f.cajeroNombre || 'Cajero',
      sucursalId: Number(f.sucursalId || f.sucursal_id || 0),
      turnoCajaId: f.turnoCajaId ? String(f.turnoCajaId) : null,
      tipoVenta: f.tipoVenta === 'B2B' ? 'B2B' : 'POS',
      subtotal,
      iva,
      total,
      totalFormateado: formatCOP(total),
      estado: (f.estado === 'anulada') ? 'anulada' : 'emitida',
      fecha: f.fecha || fechaObj.toISOString(),
      fechaFormateada,
      items,
      pagos,
      devoluciones,
    };
  }

  public async listarFacturas(
    sucursalId: number,
    filtros?: FiltrosFacturasSede,
  ): Promise<FacturasPaginadasSede> {
    const params: Record<string, string | number | undefined> = {
      sucursalId,
      limite: filtros?.limite ?? 10,
      page: filtros?.page ?? 1,
    };

    if (filtros?.estado && filtros.estado !== 'todas') {
      params.estado = filtros.estado;
    }
    if (filtros?.tipo && filtros.tipo !== 'todos') {
      params.tipo = filtros.tipo;
    }
    if (filtros?.texto?.trim()) {
      params.texto = filtros.texto.trim();
    }
    if (filtros?.desde) {
      params.desde = filtros.desde;
    }
    if (filtros?.hasta) {
      params.hasta = filtros.hasta;
    }

    const res = await this.http.get<any>('/ventas/facturas', { params });
    const rawItems = Array.isArray(res) ? res : (res?.items || res?.facturas || []);
    const items = rawItems.map((f: any) => this.mapFactura(f));
    const total = Number(res?.total ?? items.length);
    const limite = Number(res?.limite ?? (filtros?.limite ?? 10));
    const totalPaginas = Number(res?.totalPaginas ?? (Math.ceil(total / limite) || 1));
    const page = Number(res?.page ?? (filtros?.page ?? 1));

    return {
      items,
      total,
      totalPaginas,
      page,
      limite,
    };
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

  public async registrarDevolucion(
    id: string,
    payload: RegistrarDevolucionPayload,
  ): Promise<{ facturaId: string; totalReembolso: number; lineas: any[] }> {
    return await this.http.post<any>(`/ventas/facturas/${id}/devoluciones`, payload);
  }

  public async listarAlertas(
    sucursalId?: number,
    filtros?: FiltrosAlertasSede,
  ): Promise<AlertaOperativa[]> {
    const params: Record<string, string | number | undefined> = {};
    if (sucursalId) params.sucursalId = sucursalId;
    if (filtros?.estado && filtros.estado !== 'todas') params.estado = filtros.estado;
    if (filtros?.prioridad && filtros.prioridad !== 'todas') params.prioridad = filtros.prioridad;

    const res = await this.http.get<any>('/administracion/alertas', { params });
    const list = Array.isArray(res) ? res : res?.items || [];

    return list.map((a: any) => {
      const fechaCreacionObj = a.fechaCreacion ? new Date(a.fechaCreacion) : new Date();
      return {
        id: String(a.id),
        sucursalId: Number(a.sucursalId || a.sucursal_id || sucursalId || 0),
        sucursalNombre: a.sucursalNombre || 'Sede Principal',
        usuarioId: String(a.usuarioId || a.usuario_id || ''),
        usuarioEmail: a.usuarioEmail || null,
        usuarioNombre: a.usuarioNombre || a.usuarioEmail || 'Cajero Operativo',
        motivo: a.motivo || 'Alerta de Mostrador',
        prioridad: (a.prioridad === 'urgente') ? 'urgente' : 'normal',
        descripcion: a.descripcion || null,
        estado: a.estado || 'pendiente',
        fechaCreacion: a.fechaCreacion || fechaCreacionObj.toISOString(),
        fechaAtencion: a.fechaAtencion || null,
      };
    });
  }

  public async cambiarEstadoAlerta(
    id: string,
    estado: 'visto' | 'atendido',
  ): Promise<AlertaOperativa> {
    const res = await this.http.put<any>(`/administracion/alertas/${id}/estado`, {
      estado,
    });
    return {
      id: String(res.id),
      sucursalId: Number(res.sucursalId || 0),
      sucursalNombre: res.sucursalNombre,
      usuarioId: String(res.usuarioId || ''),
      usuarioEmail: res.usuarioEmail,
      usuarioNombre: res.usuarioNombre || res.usuarioEmail,
      motivo: res.motivo,
      prioridad: res.prioridad,
      descripcion: res.descripcion,
      estado: res.estado,
      fechaCreacion: res.fechaCreacion,
      fechaAtencion: res.fechaAtencion,
    };
  }
}

export const branchInvoicingService = new BranchInvoicingService();
