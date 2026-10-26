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
  CrearClienteInput,
  FacturaDto,
  ProductoResponse,
  CrearOrdenB2BPayload,
} from '../types';

export class VendedorB2bService implements IVendedorB2bService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  public async obtenerProductos(params?: {
    texto?: string;
    categoriaId?: number;
  }): Promise<ProductoResponse[]> {
    const queryParams: Record<string, string | number> = {
      limit: 100,
      page: 1,
    };
    if (params?.texto) queryParams.texto = params.texto;
    if (params?.categoriaId) queryParams.categoriaId = params.categoriaId;

    const response = await this.http.get<{
      items: ProductoResponse[];
      total: number;
    } | ProductoResponse[]>('/inventario/productos', { params: queryParams });

    if (Array.isArray(response)) {
      return response;
    }
    return response.items || [];
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

  public async crearCliente(cliente: CrearClienteInput): Promise<ClienteDto> {
    return this.http.post<ClienteDto>('/ventas/clientes', cliente);
  }

  public async crearFacturaB2B(payload: CrearOrdenB2BPayload): Promise<FacturaDto> {
    // Endpoint especializado para emisión B2B sin requisito de turno físico
    return this.http.post<FacturaDto>('/ventas/facturas/b2b', {
      ...payload,
      esB2B: true,
    });
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
