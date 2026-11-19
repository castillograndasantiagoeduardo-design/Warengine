'use client';

import React, { Suspense } from 'react';
import {
  Pagination,
  LoadingState,
  ErrorState,
} from '@/features/admin-sucursal/components/shared';
import {
  CategoryCardGrid,
  CreateEditCategoryModal,
} from '@/features/admin-sucursal/components/assets';
import { useAssetCategories } from '@/features/admin-sucursal/hooks/useAssetCategories';

function AssetCategoriesView() {
  const {
    categorias,
    total,
    totalPages,
    page,
    cargando,
    error,
    filtros,
    handlers,
    modales,
    operaciones,
  } = useAssetCategories();

  return (
    <div className="space-y-4">
      {/* Barra de Filtros y Acción Nueva Categoría */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={filtros.terminoBusqueda}
            onChange={(e) => handlers.handleBuscar(e.target.value)}
            placeholder="Buscar familia de activos..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-900/50 border border-white/10 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-white/30"
          />
        </div>

        <button
          type="button"
          onClick={() => modales.setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-neutral-900 font-semibold text-sm rounded-xl hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva categoría
        </button>
      </div>

      {/* Grid de familias dentro de contenedor */}
      {cargando ? (
        <LoadingState rows={4} />
      ) : error ? (
        <ErrorState
          title="Error al consultar categorías"
          message={error}
          onRetry={handlers.recargar}
        />
      ) : (
        <div className="space-y-4">
          <CategoryCardGrid
            categorias={categorias}
            cargando={false}
            onEditar={modales.setCategoriaParaEditar}
            onCambiarEstado={(cat) => operaciones.cambiarEstado(cat.id, !cat.isActive)}
          />

          {totalPages > 1 && (
            <div className="vidrio rounded-2xl border border-white/[0.08] overflow-hidden">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={handlers.handleCambiarPagina}
              />
            </div>
          )}
        </div>
      )}

      {/* Modal Crear Categoría */}
      <CreateEditCategoryModal
        open={modales.isCreateOpen}
        onClose={() => modales.setIsCreateOpen(false)}
        onSubmit={operaciones.crearCategoria}
      />

      {/* Modal Editar Categoría */}
      <CreateEditCategoryModal
        open={Boolean(modales.categoriaParaEditar)}
        categoria={modales.categoriaParaEditar}
        onClose={() => modales.setCategoriaParaEditar(null)}
        onSubmit={(datos) => {
          if (!modales.categoriaParaEditar) return Promise.resolve();
          return operaciones.editarCategoria(modales.categoriaParaEditar.id, datos);
        }}
      />
    </div>
  );
}

export default function AdminSucursalCategoriasPage() {
  return (
    <Suspense fallback={<LoadingState rows={4} />}>
      <AssetCategoriesView />
    </Suspense>
  );
}
