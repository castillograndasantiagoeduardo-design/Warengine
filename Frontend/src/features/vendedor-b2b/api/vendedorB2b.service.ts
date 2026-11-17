/**
 * vendedorB2b.service.ts — Implementación del servicio de comunicación HTTP para Vendedor B2B.
 *
 * Principios aplicados:
 * - DIP: Inyecta IHttpClient (apiClient por defecto).
 * - SRP: Encapsula la comunicación REST con endpoints de inventario y facturación B2B.
 */

import { IHttpClient, apiClient } from '@/lib/api';
import type { IVendedorB2bService } from './vendedorB2b.service.interface';
import type {
  ClienteDto,
  CotizacionB2BDto,
  CrearClienteInput,
  CrearClienteResultadoDto,
  CrearCotizacionB2BInput,
  EvaluacionCreditoB2BDto,
  FacturaDto,
  FacturarCotizacionResultadoDto,
  MedioPago,
  ProductoResponse,
  ProductoCatalogoB2B,
  SimularCreditoB2BInput,
} from '../types';
import type { StockSucursalResponseDTO } from '@warengine/contracts';

export class VendedorB2bService implements IVendedorB2bService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  /** Catálogo activo con el stock real de la sede del vendedor (las ventas B2B salen de ella). */
  public async obtenerProductos(
    sucursalId: number,
    params?: { texto?: string; categoriaId?: number },
  ): Promise<ProductoCatalogoB2B[]> {
    const queryParams: Record<string, string | number> = {
      limit: 100,
      page: 1,
      isActive: 'true',
    };
    if (params?.texto) queryParams.texto = params.texto;
    if (params?.categoriaId) queryParams.categoriaId = params.categoriaId;

    const [response, stock] = await Promise.all([
      this.http.get<{
        items: ProductoResponse[];
        total: number;
      } | ProductoResponse[]>('/inventario/productos', { params: queryParams }),
      this.http.get<StockSucursalResponseDTO[]>('/inventario/stock', { params: { sucursalId } }),
    ]);

    const stockPorProducto = new Map(stock.map((s) => [s.productoId, Number(s.stockActual)]));
    const productos = Array.isArray(response) ? response : response.items || [];
    return productos.map((p) => ({ ...p, stockSede: stockPorProducto.get(p.id) ?? 0 }));
  }

  public async obtenerCategorias(): Promise<Array<{ id: number; nombre: string }>> {
    try {
      const response = await this.http.get<Array<{ id: number; nombre: string }> | { items: Array<{ id: number; nombre: string }> }>('/inventario/categorias');
      if (Array.isArray(response)) return response;
      if (response && Array.isArray((response as { items?: Array<{ id: number; nombre: string }> }).items)) {
        return (response as { items: Array<{ id: number; nombre: string }> }).items;
      }
      return [];
    } catch {
      return [];
    }
  }

  public async buscarClientes(texto?: string): Promise<ClienteDto[]> {
    const params: Record<string, string | number> = { limite: 30 };
    if (texto && texto.trim()) {
      params.texto = texto.trim();
    }
    const response = await this.http.get<ClienteDto[] | { items: ClienteDto[] }>(
      '/ventas/clientes',
      { params },
    );
    if (Array.isArray(response)) return response;
    if (response && Array.isArray((response as { items?: ClienteDto[] }).items)) {
      return (response as { items: ClienteDto[] }).items;
    }
    return [];
  }

  public async crearCliente(cliente: CrearClienteInput): Promise<CrearClienteResultadoDto> {
    return this.http.post<CrearClienteResultadoDto>('/ventas/clientes', cliente);
  }

  public async simularCreditoB2B(payload: SimularCreditoB2BInput): Promise<EvaluacionCreditoB2BDto> {
    return this.http.post<EvaluacionCreditoB2BDto>('/ventas/clientes/simular-credito', payload);
  }

  public async crearCotizacionB2B(payload: CrearCotizacionB2BInput): Promise<CotizacionB2BDto> {
    return this.http.post<CotizacionB2BDto>('/ventas/cotizaciones-b2b', payload);
  }

  public async listarCotizacionesB2B(): Promise<CotizacionB2BDto[]> {
    try {
      const response = await this.http.get<CotizacionB2BDto[]>('/ventas/cotizaciones-b2b');
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  public async facturarCotizacionB2B(
    cotizacionId: string,
    payload?: { medioPago?: MedioPago; referenciaTransaccion?: string | null },
  ): Promise<FacturarCotizacionResultadoDto> {
    return this.http.post<FacturarCotizacionResultadoDto>(
      `/ventas/cotizaciones-b2b/${cotizacionId}/facturar`,
      payload ?? {},
    );
  }

  public async listarFacturasB2B(limite = 20): Promise<FacturaDto[]> {
    try {
      const response = await this.http.get<FacturaDto[] | { items: FacturaDto[] }>(
        '/ventas/facturas',
        { params: { limite } },
      );
      if (Array.isArray(response)) return response;
      if (response && Array.isArray((response as { items?: FacturaDto[] }).items)) {
        return (response as { items: FacturaDto[] }).items;
      }
      return [];
    } catch {
      return [];
    }
  }
}

export const vendedorB2bService = new VendedorB2bService();
