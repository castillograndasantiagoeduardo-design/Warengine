'use client';

/**
 * FacturasFilterBar.tsx — Barra de filtros sincronizados para el listado de facturas.
 *
 * Reutiliza el contenedor compartido `<FilterBar>` de `features/admin-sucursal/components/shared`.
 */

import React, { useState, useEffect } from 'react';
import { Search, X, Calendar } from 'lucide-react';
import { FilterBar } from '../shared/FilterBar';
import type { EstadoFacturaSede } from '../../types/branch-invoicing.types';

export interface FacturasFiltrosValores {
  texto: string;
  estado: EstadoFacturaSede | 'todas';
  tipo: 'POS' | 'B2B' | 'todos';
  desde: string;
  hasta: string;
}

interface FacturasFilterBarProps {
  valores: FacturasFiltrosValores;
  onChange: (nuevosValores: Partial<FacturasFiltrosValores>) => void;
  onLimpiar: () => void;
  disabled?: boolean;
}

export function FacturasFilterBar({
  valores,
  onChange,
  onLimpiar,
  disabled = false,
}: FacturasFilterBarProps) {
  const [textoLocal, setTextoLocal] = useState(valores.texto);

  // Sincronizar input local si los valores externos cambian (ej. botón limpiar o popstate)
  useEffect(() => {
    setTextoLocal(valores.texto);
  }, [valores.texto]);

  // Debounce de 350ms para búsqueda textual
  useEffect(() => {
    const timer = setTimeout(() => {
      if (textoLocal !== valores.texto) {
        onChange({ texto: textoLocal });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [textoLocal, valores.texto, onChange]);

  const hayFiltrosActivos =
    Boolean(valores.texto) ||
    valores.estado !== 'todas' ||
    valores.tipo !== 'todos';

  return (
    <FilterBar
      search={
        <div className="relative w-full min-w-[220px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
            aria-hidden="true"
          />
          <input
            type="text"
            value={textoLocal}
            onChange={(e) => setTextoLocal(e.target.value)}
            placeholder="Buscar por folio, cliente, documento..."
            disabled={disabled}
            aria-label="Buscar facturas"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#e3b341]/60 focus:ring-1 focus:ring-[#e3b341]/30 transition-all disabled:opacity-40"
          />
        </div>
      }
      filters={
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector Estado */}
          <select
            value={valores.estado}
            onChange={(e) =>
              onChange({ estado: e.target.value as EstadoFacturaSede | 'todas' })
            }
            disabled={disabled}
            aria-label="Filtrar por estado"
            className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-[#e3b341]/60 transition-all cursor-pointer disabled:opacity-40"
          >
            <option value="todas" className="bg-[#0b1329] text-white">
              Todos los estados
            </option>
            <option value="emitida" className="bg-[#0b1329] text-white">
              Emitida
            </option>
            <option value="anulada" className="bg-[#0b1329] text-white">
              Anulada
            </option>
          </select>

          {/* Selector Tipo */}
          <select
            value={valores.tipo}
            onChange={(e) =>
              onChange({ tipo: e.target.value as 'POS' | 'B2B' | 'todos' })
            }
            disabled={disabled}
            aria-label="Filtrar por tipo de venta"
            className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-[#e3b341]/60 transition-all cursor-pointer disabled:opacity-40"
          >
            <option value="todos" className="bg-[#0b1329] text-white">
              Todos los canales
            </option>
            <option value="POS" className="bg-[#0b1329] text-white">
              POS (Mostrador)
            </option>
            <option value="B2B" className="bg-[#0b1329] text-white">
              B2B (Corporativo)
            </option>
          </select>

          {/* Rango de fechas */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-300">
            <Calendar size={14} className="text-slate-400" aria-hidden="true" />
            <input
              type="date"
              value={valores.desde}
              onChange={(e) => onChange({ desde: e.target.value })}
              disabled={disabled}
              aria-label="Fecha inicio"
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            />
            <span className="text-slate-500">—</span>
            <input
              type="date"
              value={valores.hasta}
              onChange={(e) => onChange({ hasta: e.target.value })}
              disabled={disabled}
              aria-label="Fecha fin"
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      }
      actions={
        hayFiltrosActivos ? (
          <button
            type="button"
            onClick={onLimpiar}
            disabled={disabled}
            aria-label="Limpiar filtros"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-colors text-xs font-medium cursor-pointer"
          >
            <X size={14} aria-hidden="true" />
            <span>Limpiar</span>
          </button>
        ) : null
      }
    />
  );
}
