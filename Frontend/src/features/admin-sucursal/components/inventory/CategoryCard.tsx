'use client';

import React from 'react';
import type { CategoriaInventario } from '../../types/branch-inventory.types';

interface CategoryCardProps {
  categoria: CategoriaInventario;
  onEditar: (cat: CategoriaInventario) => void;
  onToggleEstado: (cat: CategoriaInventario) => void;
}

export function CategoryCard({ categoria, onEditar, onToggleEstado }: CategoryCardProps) {
  const isActive = categoria.isActive ?? true;
  const count = categoria.totalProductos ?? 0;

  return (
    <div className="vidrio rounded-2xl p-5 flex flex-col justify-between hover:border-white/20 transition-all">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-base font-bold text-white leading-tight">
            {categoria.nombre}
          </h3>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
              isActive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                : 'bg-white/5 text-white/40 border-white/10'
            }`}
          >
            {isActive ? 'Activa' : 'Inactiva'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs mb-4">
          <span className="text-white/40">Código:</span>
          <span className="font-mono text-white/70">CAT-{categoria.id}</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-white/40">Productos asociados:</span>
          <span className="px-2 py-0.5 rounded-md bg-white/5 font-mono font-bold text-white/90 tabular-nums">
            {count}
          </span>
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onEditar(categoria)}
          className="px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/80 hover:text-white text-xs font-medium transition-colors cursor-pointer"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onToggleEstado(categoria)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            isActive
              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
          }`}
        >
          {isActive ? 'Inactivar' : 'Activar'}
        </button>
      </div>
    </div>
  );
}
