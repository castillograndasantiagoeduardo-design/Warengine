'use client';

import React, { useEffect, useState } from 'react';
import { branchAssetsService } from '../../api/branch-assets.service';
import type { CategoriaActivoSede, EstadoActivo } from '../../types/branch-assets.types';

interface AssetFilterBarProps {
  terminoBusqueda: string;
  categoriaActivoId?: number;
  estado?: EstadoActivo;
  onBuscar: (texto: string) => void;
  onFiltrarCategoria: (categoriaId: string) => void;
  onFiltrarEstado: (estado: string) => void;
  onLimpiar: () => void;
  onNuevoActivo: () => void;
}

export function AssetFilterBar({
  terminoBusqueda,
  categoriaActivoId,
  estado,
  onBuscar,
  onFiltrarCategoria,
  onFiltrarEstado,
  onLimpiar,
  onNuevoActivo,
}: AssetFilterBarProps) {
  const [categorias, setCategorias] = useState<CategoriaActivoSede[]>([]);
  const [textoLocal, setTextoLocal] = useState(terminoBusqueda);

  useEffect(() => {
    setTextoLocal(terminoBusqueda);
  }, [terminoBusqueda]);

  // Cargar categorías disponibles para el filtro
  useEffect(() => {
    let montado = true;
    branchAssetsService.listarCategorias({ limit: 100, isActive: true }).then((res) => {
      if (montado) setCategorias(res.items);
    }).catch(() => {});
    return () => {
      montado = false;
    };
  }, []);

  // Debounce en búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      if (textoLocal !== terminoBusqueda) {
        onBuscar(textoLocal);
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [textoLocal, terminoBusqueda, onBuscar]);

  const hayFiltros = Boolean(terminoBusqueda || categoriaActivoId || estado);

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
      <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Buscador */}
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={textoLocal}
            onChange={(e) => setTextoLocal(e.target.value)}
            placeholder="Buscar por código, activo o serie..."
            className="w-full pl-9 pr-8 py-2 bg-neutral-900/50 border border-white/10 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-colors"
          />
          {textoLocal && (
            <button
              type="button"
              onClick={() => {
                setTextoLocal('');
                onBuscar('');
              }}
              className="absolute inset-y-0 right-2.5 flex items-center text-neutral-400 hover:text-neutral-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Selector de Categoría */}
        <select
          value={categoriaActivoId ?? ''}
          onChange={(e) => onFiltrarCategoria(e.target.value)}
          className="px-3 py-2 bg-neutral-900/50 border border-white/10 rounded-xl text-sm text-neutral-200 focus:outline-none focus:border-white/30 transition-colors cursor-pointer"
        >
          <option value="" className="bg-neutral-900 text-neutral-200">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id} className="bg-neutral-900 text-neutral-200">
              {c.nombre}
            </option>
          ))}
        </select>

        {/* Selector de Estado */}
        <select
          value={estado ?? ''}
          onChange={(e) => onFiltrarEstado(e.target.value)}
          className="px-3 py-2 bg-neutral-900/50 border border-white/10 rounded-xl text-sm text-neutral-200 focus:outline-none focus:border-white/30 transition-colors cursor-pointer"
        >
          <option value="" className="bg-neutral-900 text-neutral-200">Todos los estados</option>
          <option value="disponible" className="bg-neutral-900 text-neutral-200">Disponible</option>
          <option value="asignado" className="bg-neutral-900 text-neutral-200">Asignado</option>
          <option value="mantenimiento" className="bg-neutral-900 text-neutral-200">En mantenimiento</option>
          <option value="baja" className="bg-neutral-900 text-neutral-200">De baja</option>
        </select>

        {/* Limpiar Filtros */}
        {hayFiltros && (
          <button
            type="button"
            onClick={onLimpiar}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-white/5 rounded-xl transition-colors self-center"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpiar
          </button>
        )}
      </div>

      {/* Botón CTA Nuevo Activo */}
      <button
        type="button"
        onClick={onNuevoActivo}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-neutral-900 font-semibold text-sm rounded-xl hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm shrink-0"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
        </svg>
        Registrar activo
      </button>
    </div>
  );
}
