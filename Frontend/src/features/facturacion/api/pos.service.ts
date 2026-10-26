/**
 * pos.service.ts — Implementación del servicio de la Terminal de Punto de Venta (POS).
 *
 * Principio SOLID:
 * - Single Responsibility Principle (SRP): Coordina la comunicación con los endpoints
 *   de turnos, facturas, clientes e inventario.
 * - Dependency Inversion Principle (DIP): Inyecta IHttpClient (apiClient por defecto).
 */

import { IHttpClient, apiClient } from '@/lib/api';
import type { IPosService, EmitirFacturaInput, EnviarAlertaAdminInput } from './pos.interface';
import type {
  TurnoCajaDto,
  FacturaDto,
  ClienteDto,
  CrearClienteInput,
  ProductoPos,
} from '../types/pos.types';

export class PosService implements IPosService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  public async obtenerTurnoActual(): Promise<TurnoCajaDto | null> {
    try {
      const response = await this.http.get<{ turno: TurnoCajaDto | null }>('/ventas/turnos/actual');
      return response?.turno || null;
    } catch (err: any) {
      if (err?.status === 404) return null;
      throw err;
    }
  }

  public async abrirTurno(fondoInicial: number): Promise<TurnoCajaDto> {
    return await this.http.post<TurnoCajaDto>('/ventas/turnos', { fondoInicial });
  }

  public async cerrarTurno(turnoId: string, fondoFinal: number): Promise<TurnoCajaDto> {
    return await this.http.post<TurnoCajaDto>(`/ventas/turnos/${turnoId}/cerrar`, { fondoFinal });
  }

  public async buscarProductos(query?: string, _sucursalId?: number): Promise<ProductoPos[]> {
    try {
      const response = await this.http.get<any>('/inventario/productos', {
        params: {
          texto: query?.trim() || undefined,
          limit: 50,
          isActive: true,
        },
      });

      const items = Array.isArray(response) ? response : response?.items || [];
      return items.map((p: any) => ({
        id: String(p.id),
        sku: String(p.sku || ''),
        nombre: String(p.nombre || ''),
        precioVenta: Number(p.precioVenta ?? p.precio_venta ?? 0),
        precioCorporativo: Number(p.precioCorporativo ?? p.precio_corporativo ?? 0),
        categoriaId: p.categoriaId ? String(p.categoriaId) : null,
        categoriaNombre: p.categoriaNombre ? String(p.categoriaNombre) : null,
        stockActual: Number(p.stockActual ?? p.stock_actual ?? 100),
        activo: Boolean(p.activo !== false),
      }));
    } catch {
      return [];
    }
  }

  public async buscarClientes(texto?: string): Promise<ClienteDto[]> {
    try {
      const response = await this.http.get<any>('/ventas/clientes', {
        params: {
          texto: texto?.trim() || undefined,
          limite: 20,
        },
      });

      if (Array.isArray(response)) return response;
      return response?.clientes || [];
    } catch {
      return [];
    }
  }

  public async crearCliente(input: CrearClienteInput): Promise<{ cliente: ClienteDto; yaExistia: boolean }> {
    return await this.http.post<{ cliente: ClienteDto; yaExistia: boolean }>('/ventas/clientes', input);
  }

  public async emitirFactura(input: EmitirFacturaInput): Promise<FacturaDto> {
    const endpoint = input.esB2B ? '/ventas/facturas/b2b' : '/ventas/facturas';
    return await this.http.post<FacturaDto>(endpoint, {
      clienteId: input.clienteId,
      items: input.items,
      pagos: input.pagos,
      esB2B: input.esB2B ?? false,
    });
  }

  public async listarFacturas(params?: { sucursalId?: number; fechaInicio?: string; limite?: number }): Promise<FacturaDto[]> {
    try {
      const response = await this.http.get<any>('/ventas/facturas', {
        params: {
          sucursalId: params?.sucursalId,
          fechaInicio: params?.fechaInicio,
          limite: params?.limite || 30,
        },
      });

      if (Array.isArray(response)) return response;
      return response?.facturas || [];
    } catch {
      return [];
    }
  }

  public async obtenerFacturaPorId(id: string): Promise<FacturaDto> {
    return await this.http.get<FacturaDto>(`/ventas/facturas/${id}`);
  }

  public async enviarAlertaAdmin(input: EnviarAlertaAdminInput): Promise<void> {
    await this.http.post('/ventas/alertas', {
      sucursalId: input.sucursalId,
      tipo: input.tipo,
      mensaje: input.mensaje,
      prioridad: input.prioridad || 'normal',
    });
  }
}

export const posService = new PosService();
