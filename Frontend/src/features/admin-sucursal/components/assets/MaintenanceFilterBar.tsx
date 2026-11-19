'use client';

import React from 'react';
import type { TipoMantenimiento } from '../../types/branch-assets.types';

interface MaintenanceFilterBarProps {
  estado: 'todos' | 'en_curso' | 'finalizado';
  tipo?: TipoMantenimiento;
  desde?: string;
  hasta?: string;
  onCambiarEstado: (estado: 'todos' | 'en_curso' | 'finalizado') => void;
  onCambiarTipo: (tipo: string) => void;
  onCambiarFechas: (desde: string | null, hasta: string | null) => void;
  onLimpiar: () => void;
  onNuevoMantenimiento: () => void;
}

export function MaintenanceFilterBar({
  estado,
  tipo,
  desde,
  hasta,
  onCambiarEstado,
  onCambiarTipo,
  onCambiarFechas,
  onLimpiar,
  onNuevoMantenimiento,
}: MaintenanceFilterBarProps) {
  const hayFiltros = estado !== 'todos' || Boolean(tipo || desde || hasta);

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {/* Segmented selector de Estado */}
        <div className="flex items-center p-1 bg-neutral-900/60 border border-white/10 rounded-xl">
          <button
            type="button"
            onClick={() => onCambiarEstado('todos')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              estado === 'todos'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => onCambiarEstado('en_curso')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              estado === 'en_curso'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            En curso
          </button>
          <button
            type="button"
            onClick={() => onCambiarEstado('finalizado')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              estado === 'finalizado'
                ? 'bg-emerald-400 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Finalizados
          </button>
        </div>

        {/* Tipo de mantenimiento */}
        <select
          value={tipo ?? ''}
          onChange={(e) => onCambiarTipo(e.target.value)}
          className="px-3 py-2 bg-neutral-900/50 border border-white/10 rounded-xl text-sm text-neutral-200 focus:outline-none focus:border-white/30 cursor-pointer"
        >
          <option value="" className="bg-neutral-900 text-neutral-200">Todos los tipos</option>
          <option value="preventivo" className="bg-neutral-900 text-neutral-200">Preventivo</option>
          <option value="correctivo" className="bg-neutral-900 text-neutral-200">Correctivo</option>
        </select>

        {/* Fechas desde / hasta */}
        <div className="flex items-center gap-1.5 bg-neutral-900/50 border border-white/10 rounded-xl px-2.5 py-1">
          <span className="text-[11px] text-neutral-500 uppercase tracking-wider">Desde</span>
          <input
            type="date"
            value={desde || ''}
            onChange={(e) => onCambiarFechas(e.target.value || null, hasta || null)}
            className="font-mono text-xs text-neutral-200 bg-transparent focus:outline-none cursor-pointer"
          />
          <span className="text-neutral-600 px-0.5">—</span>
          <span className="text-[11px] text-neutral-500 uppercase tracking-wider">Hasta</span>
          <input
            type="date"
            value={hasta || ''}
            onChange={(e) => onCambiarFechas(desde || null, e.target.value || null)}
            className="font-mono text-xs text-neutral-200 bg-transparent focus:outline-none cursor-pointer"
          />
        </div>

        {/* Limpiar */}
        {hayFiltros && (
          <button
            type="button"
            onClick={onLimpiar}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-white/5 rounded-xl transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpiar
          </button>
        )}
      </div>

      {/* CTA Registrar Mantenimiento */}
      <button
        type="button"
        onClick={onNuevoMantenimiento}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-neutral-900 font-semibold text-sm rounded-xl hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm shrink-0"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
        </svg>
        Registrar mantenimiento
      </button>
    </div>
  );
}
