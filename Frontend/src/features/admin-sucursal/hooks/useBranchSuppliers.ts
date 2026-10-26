'use client';

/**
 * useBranchSuppliers.ts — Hook para la gestión CRUD completa de proveedores.
 * 
 * Principio SOLID: Single Responsibility Principle (SRP).
 * Encapsula la reactividad, búsqueda y mutaciones sobre proveedores comerciales (RF-ADM-B6).
 */

import { useState, useEffect, useCallback } from 'react';
import { branchInventoryService } from '../api/branch-inventory.service';
import type { IBranchInventoryService } from '../api/branch-inventory.interface';
import type {
  ProveedorInventario,
  CrearProveedorDTO,
} from '../types/branch-inventory.types';

export function useBranchSuppliers(inventoryService: IBranchInventoryService = branchInventoryService) {
  const [proveedores, setProveedores] = useState<ProveedorInventario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'inactivos'>('todos');

  const cargarProveedores = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const isActiveParam =
        filtroEstado === 'activos' ? true : filtroEstado === 'inactivos' ? false : undefined;

      const items = await inventoryService.listarProveedores({
        busqueda: busqueda.trim() || undefined,
        isActive: isActiveParam,
      });
      setProveedores(items);
    } catch (err: any) {
      console.error('[useBranchSuppliers] Error al cargar proveedores:', err);
      setError(err?.message || 'Error al conectar con el servidor de proveedores.');
    } finally {
      setIsLoading(false);
    }
  }, [inventoryService, busqueda, filtroEstado]);

  useEffect(() => {
    cargarProveedores();
  }, [cargarProveedores]);

  const crearProveedor = async (data: CrearProveedorDTO) => {
    setIsMutating(true);
    try {
      const nuevo = await inventoryService.crearProveedor(data);
      setProveedores((prev) => [nuevo, ...prev]);
      return { ok: true, data: nuevo };
    } catch (err: any) {
      console.error('[useBranchSuppliers] Error al crear proveedor:', err);
      return { ok: false, error: err?.message || 'No fue posible registrar el proveedor.' };
    } finally {
      setIsMutating(false);
    }
  };

  const editarProveedor = async (
    id: number,
    data: { nombre?: string; contacto?: string; isActive?: boolean },
  ) => {
    setIsMutating(true);
    try {
      await inventoryService.editarProveedor(id, data);
      await cargarProveedores();
      return { ok: true };
    } catch (err: any) {
      console.error('[useBranchSuppliers] Error al editar proveedor:', err);
      return { ok: false, error: err?.message || 'No fue posible actualizar el proveedor.' };
    } finally {
      setIsMutating(false);
    }
  };

  const cambiarEstado = async (id: number, isActive: boolean) => {
    // Optimistic update
    setProveedores((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive } : p)),
    );
    try {
      await inventoryService.cambiarEstadoProveedor(id, isActive);
      setError(null);
    } catch (err: any) {
      const msg = err?.message || 'No se puede desactivar el proveedor porque tiene productos activos vinculados (RF-ADM-B19).';
      setError(msg);
      await cargarProveedores();
    }
  };

  return {
    proveedores,
    isLoading,
    isMutating,
    error,
    busqueda,
    setBusqueda,
    filtroEstado,
    setFiltroEstado,
    recargar: cargarProveedores,
    crearProveedor,
    editarProveedor,
    cambiarEstado,
  };
}
