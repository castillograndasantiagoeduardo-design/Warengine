'use client';

import React, { useState, useEffect } from 'react';
import type { CategoriaInventario } from '../../types/branch-inventory.types';

interface ProductsFilterBarProps {
  textoInicial?: string;
  categoriaIdInicial?: number;
  estadoInicial?: string;
  categorias: CategoriaInventario[];
  onCambiarFiltros: (filtros: {
    texto?: string;
    categoriaId?: number;
    sinCategoria?: boolean;
    estado?: 'todos' | 'activo' | 'inactivo';
  }) => void;
  onCrearProducto: () => void;
  onRegistrarEntrada: () => void;
  onImportarCsv: () => void;
  onExportarCsv: () => void;
  isExporting?: boolean;
}

export function ProductsFilterBar({
  textoInicial = '',
  categoriaIdInicial,
  estadoInicial = 'activo',
  categorias = [],
  onCambiarFiltros,
  onCrearProducto,
  onRegistrarEntrada,
  onImportarCsv,
  onExportarCsv,
  isExporting = false,
}: ProductsFilterBarProps) {
  const [texto, setTexto] = useState(textoInicial);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>(
    categoriaIdInicial !== undefined ? String(categoriaIdInicial) : 'todas',
  );
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<string>(estadoInicial);

  // Debounce para búsqueda por texto
  useEffect(() => {
    const timer = setTimeout(() => {
      if (texto !== textoInicial) {
        aplicarCambios(texto, categoriaSeleccionada, estadoSeleccionado);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [texto]);

  const aplicarCambios = (t: string, c: string, e: string) => {
    const filtros: {
      texto?: string;
      categoriaId?: number;
      sinCategoria?: boolean;
      estado?: 'todos' | 'activo' | 'inactivo';
    } = {
      texto: t.trim() || undefined,
      estado: e as any,
    };

    if (c === '-1') {
      filtros.sinCategoria = true;
      filtros.categoriaId = -1;
    } else if (c !== 'todas') {
      filtros.categoriaId = Number(c);
      filtros.sinCategoria = false;
    } else {
      filtros.categoriaId = undefined;
      filtros.sinCategoria = false;
    }

    onCambiarFiltros(filtros);
  };

  const handleCategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCategoriaSeleccionada(val);
    aplicarCambios(texto, val, estadoSeleccionado);
  };

  const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setEstadoSeleccionado(val);
    aplicarCambios(texto, categoriaSeleccionada, val);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between">
      {/* Controles de filtrado */}
      <div className="flex flex-1 flex-col sm:flex-row gap-2.5 items-center">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="w-full h-10 px-3.5 pl-9 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/40 text-xs focus:outline-none focus:border-rose-500/60 transition-colors"
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
          value={categoriaSeleccionada}
          onChange={handleCategoriaChange}
          aria-label="Filtrar por categoría"
          className="h-10 w-full sm:w-auto px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500/60 transition-colors cursor-pointer"
        >
          <option value="todas" className="bg-[#0f172a] text-white">
            Todas las categorías
          </option>
          <option value="-1" className="bg-[#0f172a] text-white">
            Sin categoría
          </option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id} className="bg-[#0f172a] text-white">
              {c.nombre}
            </option>
          ))}
        </select>

        <select
          value={estadoSeleccionado}
          onChange={handleEstadoChange}
          aria-label="Filtrar por estado del producto"
          className="h-10 w-full sm:w-auto px-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500/60 transition-colors cursor-pointer"
        >
          <option value="activo" className="bg-[#0f172a] text-white">
            Activos
          </option>
          <option value="inactivo" className="bg-[#0f172a] text-white">
            Inactivos
          </option>
          <option value="todos" className="bg-[#0f172a] text-white">
            Todos
          </option>
        </select>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onImportarCsv}
          className="h-10 px-3.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-medium transition-colors cursor-pointer"
        >
          Importar CSV
        </button>

        <button
          type="button"
          onClick={onExportarCsv}
          disabled={isExporting}
          className="h-10 px-3.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
        >
          {isExporting ? 'Exportando...' : 'Exportar CSV'}
        </button>

        <button
          type="button"
          onClick={onRegistrarEntrada}
          className="h-10 px-3.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-medium transition-colors cursor-pointer"
        >
          Entrada de mercancía
        </button>

        <button
          type="button"
          onClick={onCrearProducto}
          className="h-10 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
        >
          + Crear producto
        </button>
      </div>
    </div>
  );
}
