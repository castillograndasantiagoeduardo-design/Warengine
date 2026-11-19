'use client';

import React from 'react';

interface StaffFilterBarProps {
  busqueda: string;
  onBusquedaChange: (val: string) => void;
  cargo: string;
  onCargoChange: (cargo: string) => void;
  estado: string;
  onEstadoChange: (estado: string) => void;
  hayFiltrosActivos: boolean;
  onLimpiarFiltros: () => void;
}

export function StaffFilterBar({
  busqueda,
  onBusquedaChange,
  cargo,
  onCargoChange,
  estado,
  onEstadoChange,
  hayFiltrosActivos,
  onLimpiarFiltros,
}: StaffFilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
      {/* Input de búsqueda */}
      <div className="relative flex-1 min-w-[240px]">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          placeholder="Buscar por nombre, documento o cargo..."
          className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
        />
        {busqueda && (
          <button
            type="button"
            onClick={() => onBusquedaChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white"
            aria-label="Limpiar término de búsqueda"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Selects y controles */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Selector de cargo / rol */}
        <select
          value={cargo}
          onChange={(e) => onCargoChange(e.target.value)}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
          aria-label="Filtrar por cargo o puesto"
        >
          <option value="" className="bg-slate-900 text-white">Todos los cargos</option>
          <option value="Cajero" className="bg-slate-900 text-white">Cajero</option>
          <option value="Vendedor" className="bg-slate-900 text-white">Vendedor B2B</option>
          <option value="Administrador" className="bg-slate-900 text-white">Administrador</option>
          <option value="Supervisor" className="bg-slate-900 text-white">Supervisor</option>
          <option value="Bodeguero" className="bg-slate-900 text-white">Bodeguero</option>
        </select>

        {/* Selector de estado */}
        <select
          value={estado}
          onChange={(e) => onEstadoChange(e.target.value)}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
          aria-label="Filtrar por estado del empleado"
        >
          <option value="" className="bg-slate-900 text-white">Todos los estados</option>
          <option value="activo" className="bg-slate-900 text-white">Activos</option>
          <option value="inactivo" className="bg-slate-900 text-white">Inactivos</option>
        </select>

        {/* Botón limpiar filtros */}
        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={onLimpiarFiltros}
            className="px-3 py-2 rounded-lg text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
