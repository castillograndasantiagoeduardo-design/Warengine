'use client';

import React from 'react';
import type { CategoriaActivoSede } from '../../types/branch-assets.types';

interface CategoryCardGridProps {
  categorias: CategoriaActivoSede[];
  cargando: boolean;
  onEditar: (cat: CategoriaActivoSede) => void;
  onCambiarEstado: (cat: CategoriaActivoSede) => void;
}

export function CategoryCardGrid({
  categorias,
  cargando,
  onEditar,
  onCambiarEstado,
}: CategoryCardGridProps) {
  if (cargando) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-3" />
        <p className="text-sm text-neutral-400">Cargando familias de activos...</p>
      </div>
    );
  }

  if (categorias.length === 0) {
    return (
      <div className="py-16 text-center px-4">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-white/5 flex items-center justify-center text-neutral-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-neutral-200">No hay categorías registradas</h3>
        <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
          Crea familias para clasificar mobiliario, tecnología, maquinaria o vehículos de la sede.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {categorias.map((cat) => (
        <div
          key={cat.id}
          className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-semibold text-sm text-neutral-100 group-hover:text-white transition-colors">
                {cat.nombre}
              </h4>
              <span
                className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                  cat.isActive ? 'bg-emerald-400' : 'bg-neutral-600'
                }`}
                title={cat.isActive ? 'Categoría activa' : 'Categoría inactiva'}
              />
            </div>

            <div className="text-xs text-neutral-400 flex items-center gap-1.5 mb-4">
              <span className="font-mono font-semibold text-neutral-200">
                {cat.cantidadActivos}
              </span>
              <span>{cat.cantidadActivos === 1 ? 'activo registrado' : 'activos registrados'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => onCambiarEstado(cat)}
              className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                cat.isActive
                  ? 'text-neutral-400 hover:text-amber-300 hover:bg-amber-500/10'
                  : 'text-neutral-500 hover:text-emerald-300 hover:bg-emerald-500/10'
              }`}
            >
              {cat.isActive ? 'Desactivar' : 'Activar'}
            </button>

            <button
              type="button"
              onClick={() => onEditar(cat)}
              className="text-xs font-medium text-neutral-300 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              Editar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
