'use client';

import React from 'react';
import type { AtajoFecha } from '../../hooks/useShiftHistory';

interface ShiftHistoryFilterBarProps {
  desde: string;
  hasta: string;
  onDesdeChange: (val: string) => void;
  onHastaChange: (val: string) => void;
  tipoCierre: string;
  onTipoCierreChange: (tipo: string) => void;
  conDiferencia: boolean;
  onToggleConDiferencia: () => void;
  onAtajoFecha: (atajo: AtajoFecha) => void;
  hayFiltrosActivos: boolean;
  onLimpiarFiltros: () => void;
}

export function ShiftHistoryFilterBar({
  desde,
  hasta,
  onDesdeChange,
  onHastaChange,
  tipoCierre,
  onTipoCierreChange,
  conDiferencia,
  onToggleConDiferencia,
  onAtajoFecha,
  hayFiltrosActivos,
  onLimpiarFiltros,
}: ShiftHistoryFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
      {/* Fila superior: Atajos y fechas */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Atajos de rango de fecha */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => onAtajoFecha('hoy')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => onAtajoFecha('7d')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            7 días
          </button>
          <button
            type="button"
            onClick={() => onAtajoFecha('30d')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            30 días
          </button>
        </div>

        {/* Inputs de fecha específica */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-white/40">Desde:</span>
            <input
              type="date"
              value={desde}
              onChange={(e) => onDesdeChange(e.target.value)}
              className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              aria-label="Fecha inicial"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white/40">Hasta:</span>
            <input
              type="date"
              value={hasta}
              onChange={(e) => onHastaChange(e.target.value)}
              className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              aria-label="Fecha final"
            />
          </div>
        </div>
      </div>

      {/* Fila inferior: Filtros de tipo de cierre y checkbox */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de tipo de cierre */}
          <select
            value={tipoCierre}
            onChange={(e) => onTipoCierreChange(e.target.value)}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            aria-label="Filtrar por tipo de cierre"
          >
            <option value="" className="bg-slate-900 text-white">Todos los tipos de cierre</option>
            <option value="normal" className="bg-slate-900 text-white">Cierres normales (cajero)</option>
            <option value="administrativo" className="bg-slate-900 text-white">Cierres administrativos</option>
          </select>

          {/* Checkbox solo con diferencia */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-white/80 hover:text-white">
            <input
              type="checkbox"
              checked={conDiferencia}
              onChange={onToggleConDiferencia}
              className="rounded border-white/20 bg-white/5 text-brand-500 focus:ring-brand-500 focus:ring-offset-0"
            />
            <span>Solo con diferencia (sobrante o faltante)</span>
          </label>
        </div>

        {/* Botón limpiar */}
        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={onLimpiarFiltros}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1.5"
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
