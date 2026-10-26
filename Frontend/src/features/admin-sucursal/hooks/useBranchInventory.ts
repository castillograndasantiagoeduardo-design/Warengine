'use client';

/**
 * useBranchInventory.ts — Custom Hook para la gestión integral de inventario de sede.
 * 
 * Principio SOLID:
 * - Single Responsibility (SRP): Centraliza el estado reactivo, filtros, paginación
 *   y mutaciones sobre el catálogo y existencias de la sucursal activa.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  branchInventoryService,
} from '../api/branch-inventory.service';
import type { IBranchInventoryService } from '../api/branch-inventory.interface';
import type {
  ProductoInventarioSede,
  FiltrosInventarioSede,
  CategoriaInventario,
  CrearCategoriaDTO,
  ProveedorInventario,
  ActualizarProductoDTO,
  CrearProveedorDTO,
} from '../types/branch-inventory.types';

interface UseBranchInventoryOptions {
  sucursalId: number;
  inventoryService?: IBranchInventoryService;
  initialFiltros?: FiltrosInventarioSede;
}

export function useBranchInventory({
  sucursalId,
  inventoryService = branchInventoryService,
  initialFiltros,
}: UseBranchInventoryOptions) {
  const [productos, setProductos] = useState<ProductoInventarioSede[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialFiltros?.page ?? 1);
  const [limit, setLimit] = useState(initialFiltros?.limit ?? 25);
  const [totalPages, setTotalPages] = useState(1);

  const [categorias, setCategorias] = useState<CategoriaInventario[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorInventario[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filtros, setFiltros] = useState<FiltrosInventarioSede>({
    texto: '',
    nivelStock: 'todos',
    ...initialFiltros,
  });

  // 1. Cargar metadatos iniciales (categorías y proveedores de la BD)
  const cargarMetadatos = useCallback(async () => {
    try {
      const [cats, provs] = await Promise.all([
        inventoryService.listarCategorias(),
        inventoryService.listarProveedores(),
      ]);
      setCategorias(cats);
      setProveedores(provs);
    } catch (err: any) {
      console.error('[useBranchInventory] Error al cargar categorías/proveedores:', err);
    }
  }, [inventoryService]);

  // 2. Cargar inventario filtrado de la sucursal
  const cargarInventario = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await inventoryService.listarInventarioSede(sucursalId, {
        ...filtros,
        page,
        limit,
      });
      setProductos(resp.items);
      setTotal(resp.total);
      setTotalPages(resp.totalPages);
    } catch (err: any) {
      console.error('[useBranchInventory] Error al consultar inventario de sede:', err);
      setError(err?.message || 'Error al conectar con el inventario de la sucursal.');
    } finally {
      setIsLoading(false);
    }
  }, [inventoryService, sucursalId, filtros, page, limit]);

  useEffect(() => {
    cargarMetadatos();
  }, [cargarMetadatos]);

  useEffect(() => {
    cargarInventario();
  }, [cargarInventario]);

  // 3. Mutación: Editar Producto y Stock Mínimo de Sede
  const editarProducto = async (productoId: string, data: ActualizarProductoDTO) => {
    setIsMutating(true);
    try {
      await inventoryService.editarProducto(productoId, data, sucursalId);
      await cargarInventario();
      return { ok: true };
    } catch (err: any) {
      console.error('[useBranchInventory] Error al editar producto:', err);
      return { ok: false, error: err?.message || 'Error al actualizar producto.' };
    } finally {
      setIsMutating(false);
    }
  };

  // 4. Mutación: Alternar estado de activación
  const cambiarEstado = async (productoId: string, isActive: boolean) => {
    // Actualización optimista local
    setProductos((prev) =>
      prev.map((p) => (p.id === productoId ? { ...p, isActive } : p)),
    );
    try {
      await inventoryService.cambiarEstadoProducto(productoId, isActive);
    } catch (err: any) {
      console.error('[useBranchInventory] Error al cambiar estado:', err);
      // Revertir ante error
      await cargarInventario();
    }
  };

  // 5. Mutación: Actualizar umbral de stock mínimo
  const actualizarStockMinimo = async (productoId: string, nuevoStockMinimo: number) => {
    setIsMutating(true);
    try {
      await inventoryService.configurarStockMinimo(productoId, sucursalId, nuevoStockMinimo);
      setProductos((prev) =>
        prev.map((p) =>
          p.id === productoId
            ? {
                ...p,
                stockMinimo: nuevoStockMinimo,
                estadoStock:
                  p.stockActual <= 0
                    ? 'agotado'
                    : p.stockActual <= nuevoStockMinimo
                    ? 'bajo'
                    : 'optimo',
              }
            : p,
        ),
      );
      return { ok: true };
    } catch (err: any) {
      console.error('[useBranchInventory] Error al fijar stock mínimo:', err);
      return { ok: false, error: err?.message || 'Error al actualizar stock mínimo.' };
    } finally {
      setIsMutating(false);
    }
  };

  // 6. Mutación: Crear nuevo proveedor en vivo
  const crearProveedor = async (data: CrearProveedorDTO) => {
    setIsMutating(true);
    try {
      const nuevoProv = await inventoryService.crearProveedor(data);
      setProveedores((prev) => [...prev, nuevoProv]);
      return { ok: true, data: nuevoProv };
    } catch (err: any) {
      console.error('[useBranchInventory] Error al crear proveedor:', err);
      return { ok: false, error: err?.message || 'Error al crear proveedor.' };
    } finally {
      setIsMutating(false);
    }
  };

  // 7. Mutación: Crear nueva categoría en vivo
  const crearCategoria = async (nombreOData: string | CrearCategoriaDTO) => {
    setIsMutating(true);
    try {
      const nuevaCat = await inventoryService.crearCategoria(nombreOData);
      setCategorias((prev) => {
        const existe = prev.some((c) => c.id === nuevaCat.id);
        if (existe) return prev;
        return [...prev, nuevaCat].sort((a, b) => a.nombre.localeCompare(b.nombre));
      });
      return { ok: true, data: nuevaCat };
    } catch (err: any) {
      console.error('[useBranchInventory] Error al crear categoría:', err);
      return { ok: false, error: err?.message || 'Error al crear categoría.' };
    } finally {
      setIsMutating(false);
    }
  };

  const actualizarFiltros = (nuevosFiltros: Partial<FiltrosInventarioSede>) => {
    setFiltros((prev) => ({ ...prev, ...nuevosFiltros }));
    setPage(1); // Regresar a la página 1 ante cualquier cambio de filtro
  };

  return {
    productos,
    total,
    page,
    limit,
    totalPages,
    categorias,
    proveedores,
    isLoading,
    isMutating,
    error,
    filtros,
    actualizarFiltros,
    cambiarPagina: setPage,
    recargar: cargarInventario,
    editarProducto,
    cambiarEstado,
    actualizarStockMinimo,
    crearProveedor,
    crearCategoria,
  };
}
