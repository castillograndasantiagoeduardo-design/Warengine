/**
 * branch-inventory.service.ts — Implementación del servicio de inventario para sede.
 * 
 * Principio SOLID:
 * - Single Responsibility (SRP): Coordina las peticiones al catálogo, existencias de sede,
 *   umbrales de stock y proveedores.
 * - Dependency Inversion (DIP): Inyecta IHttpClient desacoplando la capa de transporte.
 */

import { IHttpClient, apiClient } from '@/lib/api';
import type { IBranchInventoryService } from './branch-inventory.interface';
import type {
  ProductoInventarioSede,
  FiltrosInventarioSede,
  CategoriaInventario,
  ProveedorInventario,
  ActualizarProductoDTO,
  CrearProveedorDTO,
} from '../types/branch-inventory.types';

export class BranchInventoryService implements IBranchInventoryService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  public async listarInventarioSede(
    sucursalId: number,
    filtros?: FiltrosInventarioSede,
  ): Promise<{
    items: ProductoInventarioSede[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filtros?.page ?? 1;
    const limit = filtros?.limit ?? 25;

    // 1. Peticiones simultáneas a los endpoints de backend
    const [productosRes, existenciasRes, categoriasRes, proveedoresRes] = await Promise.all([
      this.http.get<any>('/inventario/productos', {
        params: {
          texto: filtros?.texto || undefined,
          categoriaId: filtros?.categoriaId || undefined,
          proveedorId: filtros?.proveedorId || undefined,
          isActive: filtros?.isActive !== undefined ? filtros.isActive : undefined,
          page,
          limit,
        },
      }),
      this.http.get<any>('/administracion/dashboard/inventario', {
        params: { sucursalIds: sucursalId },
      }),
      this.listarCategorias().catch(() => [] as CategoriaInventario[]),
      this.listarProveedores().catch(() => [] as ProveedorInventario[]),
    ]);

    const rawProducts: any[] = productosRes?.items || [];
    const rawExistencias: any[] = Array.isArray(existenciasRes) ? existenciasRes : [];

    // Mapas para resolución O(1) de nombres de categoría, proveedor y stock en sede
    const categoriaMap = new Map<number, string>(
      categoriasRes.map((c) => [c.id, c.nombre]),
    );
    const proveedorMap = new Map<number, string>(
      proveedoresRes.map((p) => [p.id, p.nombre]),
    );

    // Mapa de stock por productoId para la sucursal actual
    const stockMap = new Map<
      string,
      { stockActual: number; stockMinimo: number; estado: string }
    >();

    for (const item of rawExistencias) {
      const prodId = item.productoId;
      const sedesList: any[] = item.existenciasPorSucursal || [];
      const currentBranchData = sedesList.find(
        (s: any) => Number(s.sucursalId) === Number(sucursalId),
      );

      if (currentBranchData) {
        stockMap.set(prodId, {
          stockActual: Number(currentBranchData.stockActual ?? 0),
          stockMinimo: Number(currentBranchData.stockMinimo ?? 0),
          estado: currentBranchData.estadoStock || 'optimo',
        });
      }
    }

    // 2. Mapeo estructurado por producto
    let items: ProductoInventarioSede[] = rawProducts.map((p) => {
      const branchStock = stockMap.get(p.id) || {
        stockActual: 0,
        stockMinimo: 0,
        estado: 'critico',
      };

      const stockActual = branchStock.stockActual;
      const stockMinimo = branchStock.stockMinimo;

      let estadoStock: 'optimo' | 'bajo' | 'critico' | 'agotado' = 'optimo';
      if (stockActual <= 0) {
        estadoStock = 'agotado';
      } else if (stockActual <= stockMinimo) {
        estadoStock = 'bajo';
      }

      const precioCompra = Number(p.precioCompra ?? 0);
      const precioVenta = Number(p.precioVenta ?? 0);
      const margenGananciaPorcentaje =
        precioCompra > 0
          ? Number((((precioVenta - precioCompra) / precioCompra) * 100).toFixed(1))
          : 0;

      return {
        id: p.id,
        sku: p.sku,
        nombre: p.nombre,
        categoriaId: p.categoriaId ?? null,
        categoriaNombre: p.categoriaId ? categoriaMap.get(p.categoriaId) : undefined,
        proveedorId: p.proveedorId ?? null,
        proveedorNombre: p.proveedorId ? proveedorMap.get(p.proveedorId) : undefined,
        precioCompra,
        precioVenta,
        precioCorporativo: p.precioCorporativo ? Number(p.precioCorporativo) : null,
        isActive: Boolean(p.isActive),
        stockActual,
        stockMinimo,
        estadoStock,
        margenGananciaPorcentaje,
      };
    });

    // 3. Filtro en memoria por nivel de stock si aplica
    if (filtros?.nivelStock && filtros.nivelStock !== 'todos') {
      if (filtros.nivelStock === 'optimo') {
        items = items.filter((i) => i.estadoStock === 'optimo');
      } else if (filtros.nivelStock === 'bajo') {
        items = items.filter((i) => i.estadoStock === 'bajo' || i.estadoStock === 'critico');
      } else if (filtros.nivelStock === 'agotado') {
        items = items.filter((i) => i.estadoStock === 'agotado');
      }
    }

    return {
      items,
      total: productosRes?.total ?? items.length,
      page: productosRes?.page ?? page,
      limit: productosRes?.limit ?? limit,
      totalPages: productosRes?.totalPages ?? (Math.ceil(items.length / limit) || 1),
    };
  }

  public async editarProducto(
    productoId: string,
    data: ActualizarProductoDTO,
    sucursalId?: number,
  ): Promise<void> {
    const payload: Record<string, any> = {};
    if (data.nombre !== undefined) payload.nombre = data.nombre;
    if (data.sku !== undefined) payload.sku = data.sku;
    if (data.categoriaId !== undefined) payload.categoriaId = data.categoriaId;
    if (data.proveedorId !== undefined) payload.proveedorId = data.proveedorId;
    if (data.precioCompra !== undefined) payload.precioCompra = Number(data.precioCompra);
    if (data.precioVenta !== undefined) payload.precioVenta = Number(data.precioVenta);
    if (data.precioCorporativo !== undefined) payload.precioCorporativo = data.precioCorporativo ? Number(data.precioCorporativo) : null;
    if (data.isActive !== undefined) payload.isActive = Boolean(data.isActive);

    if (Object.keys(payload).length > 0) {
      await this.http.put(`/inventario/productos/${productoId}`, payload);
    }

    // Si se especificó un nuevo stock mínimo para la sucursal actual
    if (data.stockMinimoSede !== undefined && sucursalId) {
      await this.configurarStockMinimo(productoId, sucursalId, Number(data.stockMinimoSede));
    }
  }

  public async cambiarEstadoProducto(productoId: string, isActive: boolean): Promise<void> {
    await this.http.put(`/inventario/productos/${productoId}/estado`, { isActive });
  }

  public async configurarStockMinimo(
    productoId: string,
    sucursalId: number,
    stockMinimo: number,
  ): Promise<void> {
    await this.http.put('/inventario/stock-minimo', {
      productoId,
      sucursalId,
      stockMinimo,
    });
  }

  public async listarCategorias(): Promise<CategoriaInventario[]> {
    const res = await this.http.get<any>('/inventario/categorias');
    const items = res?.items || (Array.isArray(res) ? res : []);
    return items.map((c: any) => ({
      id: Number(c.id || c.id_categoria),
      nombre: c.nombre,
      isActive: Boolean(c.isActive ?? c.is_active ?? true),
    }));
  }

  public async listarProveedores(filtros?: { busqueda?: string; isActive?: boolean }): Promise<ProveedorInventario[]> {
    const params: Record<string, any> = {};
    if (filtros?.busqueda) params.busqueda = filtros.busqueda;
    if (filtros?.isActive !== undefined) params.isActive = filtros.isActive ? '1' : '0';

    const res = await this.http.get<any>('/inventario/proveedores', { params });
    const items = res?.items || (Array.isArray(res) ? res : []);
    return items.map((p: any) => ({
      id: Number(p.id || p.id_proveedor),
      nombre: p.nombre,
      contacto: p.contacto,
      isActive: Boolean(p.isActive ?? p.is_active ?? true),
    }));
  }

  public async crearProveedor(data: CrearProveedorDTO): Promise<ProveedorInventario> {
    const res = await this.http.post<any>('/inventario/proveedores', {
      nombre: data.nombre.trim(),
      contacto: data.contacto?.trim() || null,
    });
    return {
      id: Number(res.id || res.id_proveedor),
      nombre: res.nombre,
      contacto: res.contacto,
      isActive: true,
    };
  }

  public async editarProveedor(
    id: number,
    data: { nombre?: string; contacto?: string; isActive?: boolean },
  ): Promise<void> {
    const payload: Record<string, any> = {};
    if (data.nombre !== undefined) payload.nombre = data.nombre.trim();
    if (data.contacto !== undefined) payload.contacto = data.contacto.trim() || null;
    if (data.isActive !== undefined) payload.isActive = Boolean(data.isActive);

    await this.http.put(`/inventario/proveedores/${id}`, payload);
  }

  public async cambiarEstadoProveedor(id: number, isActive: boolean): Promise<void> {
    await this.http.put(`/inventario/proveedores/${id}/estado`, { isActive });
  }
}

export const branchInventoryService = new BranchInventoryService();
