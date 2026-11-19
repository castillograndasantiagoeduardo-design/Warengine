'use client';

/**
 * /admin-sucursal/inventario/categorias — Submódulo de Categorías de productos.
 * Grid de tarjetas con conteo de artículos, advertencia RF-ADM-B19 y modales sobre Modal.tsx.
 */

import React, { useState, useEffect } from 'react';
import { branchInventoryService } from '@/features/admin-sucursal/api/branch-inventory.service';
import {
  CategoryCard,
  EditCategoryModal,
} from '@/features/admin-sucursal/components/inventory';
import { CreateCategoryModal } from '@/features/admin-sucursal';
import { LoadingState, EmptyState } from '@/features/admin-sucursal/components/shared/States';
import type { CategoriaInventario } from '@/features/admin-sucursal/types/branch-inventory.types';

export default function AdminSucursalInventarioCategoriasPage() {
  const [categorias, setCategorias] = useState<CategoriaInventario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'activas' | 'inactivas'>('todas');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaInventario | null>(null);

  const cargarCategorias = async () => {
    setIsLoading(true);
    try {
      const data = await branchInventoryService.listarCategorias();
      setCategorias(data);
    } catch {
      setCategorias([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const handleToggleEstado = async (cat: CategoriaInventario) => {
    const nuevoEstado = !cat.isActive;

    // Regla RF-ADM-B19: Si se intenta inactivar una categoría con productos asociados
    if (!nuevoEstado && (cat.totalProductos ?? 0) > 0) {
      alert(
        `Esta categoría tiene ${cat.totalProductos} productos asociados en el catálogo. Para inactivarla, primero debes reasignar o inactivar sus productos.`,
      );
      return;
    }

    try {
      await branchInventoryService.cambiarEstadoCategoria(cat.id, nuevoEstado);
      setCategorias((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: nuevoEstado } : c)),
      );
    } catch (err: any) {
      alert(err?.message || 'Error al cambiar el estado de la categoría.');
    }
  };

  const categoriasFiltradas = categorias.filter((c) => {
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const matchNombre = c.nombre.toLowerCase().includes(q);
      if (!matchNombre) return false;
    }
    if (filtroEstado === 'activas' && !c.isActive) return false;
    if (filtroEstado === 'inactivas' && c.isActive) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Acción */}
      <div className="vidrio rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row gap-2.5 items-center">
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full h-10 px-3.5 pl-9 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 text-xs focus:outline-none focus:border-rose-500"
            />
            <svg
              className="w-4 h-4 absolute left-3 top-3 text-white/40 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as any)}
            aria-label="Filtrar por estado"
            className="h-10 w-full sm:w-auto px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="todas">Todas las categorías</option>
            <option value="activas">Solo activas</option>
            <option value="inactivas">Solo inactivas</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="h-10 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
        >
          <span>+</span>
          <span>Nueva Categoría</span>
        </button>
      </div>

      {/* Grid de Tarjetas de Categorías */}
      {isLoading ? (
        <div className="vidrio rounded-2xl p-6">
          <LoadingState rows={6} />
        </div>
      ) : categoriasFiltradas.length === 0 ? (
        <div className="vidrio rounded-2xl p-12">
          <EmptyState
            title="No se encontraron categorías"
            description="No existen categorías registradas o que coincidan con la búsqueda actual."
            action={
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer"
              >
                Crear primera categoría
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriasFiltradas.map((cat) => (
            <CategoryCard
              key={cat.id}
              categoria={cat}
              onEditar={(c) => {
                setCategoriaSeleccionada(c);
                setEditModalOpen(true);
              }}
              onToggleEstado={handleToggleEstado}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      <CreateCategoryModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCategoriaCreada={() => {
          cargarCategorias();
        }}
        crearCategoriaFn={async (nombre) => {
          try {
            const data = await branchInventoryService.crearCategoria(nombre);
            return { ok: true, data };
          } catch (err: any) {
            return { ok: false, error: err?.message };
          }
        }}
      />

      <EditCategoryModal
        open={editModalOpen}
        categoria={categoriaSeleccionada}
        onClose={() => setEditModalOpen(false)}
        onGuardado={() => {
          cargarCategorias();
        }}
      />
    </div>
  );
}
