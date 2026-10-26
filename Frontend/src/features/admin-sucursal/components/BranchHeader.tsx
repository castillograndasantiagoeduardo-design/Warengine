'use client';

/**
 * BranchHeader.tsx — Cabecera de control rápido para la sucursal activa.
 *
 * Principio SOLID: Single Responsibility (SRP).
 * Encapsula la búsqueda global de catálogo/facturas, selector de período temporal,
 * identificador de sede y llamada a la acción principal con botón mecánico 3D.
 */

import React from 'react';
import { SearchIcon } from './Icons';
import type { DashboardPeriodo } from '../types/branch-dashboard.types';

interface BranchHeaderProps {
  periodo?: DashboardPeriodo;
  onPeriodoChange?: (periodo: DashboardPeriodo) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  sucursalNombre?: string;
  className?: string;
}

const PERIODOS: Array<{ id: DashboardPeriodo; label: string }> = [
  { id: 'hoy', label: 'Hoy' },
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
];

export function BranchHeader({
  periodo = 'hoy',
  onPeriodoChange,
  searchTerm = '',
  onSearchChange,
  sucursalNombre,
  className = '',
}: BranchHeaderProps) {
  return (
    <header
      className={`
        flex flex-wrap items-center justify-between gap-3 px-6 py-4
        bg-[#09132b]/60 backdrop-blur-md border-b border-white/[0.08]
        ${className}
      `}
    >
      {/* 1. Búsqueda Global con atajo de teclado ⌘ K */}
      <div className="relative flex-1 min-w-[260px] max-w-md">
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3.5 text-slate-400">
            <SearchIcon size={16} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Buscar producto, código SKU, factura..."
            className="
              w-full h-10 pl-9 pr-14 text-xs text-white placeholder-slate-400
              bg-[#09132b]/50 border border-white/[0.08] rounded-xl
              focus:outline-none focus:border-[#e3b341]/60 focus:ring-1 focus:ring-[#e3b341]/40
              transition-all duration-150 font-[family-name:var(--font-archivo)]
            "
          />
          <span className="pointer-events-none absolute right-2.5 px-1.5 py-0.5 rounded border border-white/[0.12] bg-white/[0.04] text-[10px] text-slate-400 font-mono">
            ⌘ K
          </span>
        </div>
      </div>

      {/* 2. Controles de Cabecera: Rango de fechas, Selector de Sede y Botón 3D */}
      <div className="flex items-center gap-3">
        {/* Filtro de Rango de Fechas */}
        <div className="flex items-center p-1 rounded-xl bg-[#09132b]/50 border border-white/[0.08] text-xs">
          {PERIODOS.map((p) => {
            const isActive = periodo === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onPeriodoChange?.(p.id)}
                className={`
                  px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer
                  font-[family-name:var(--font-pixelify)]
                  ${
                    isActive
                      ? 'bg-[#e3b341]/15 text-[#e3b341] border border-[#e3b341]/30 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }
                `}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Selector de Sede Activa */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs font-medium text-slate-300">
          <span>🏢</span>
          <span className="font-[family-name:var(--font-archivo)]">{sucursalNombre}</span>
          <span className="text-slate-500 text-[10px]">▾</span>
        </div>
      </div>
    </header>
  );
}
