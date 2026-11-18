'use client';

import React, { useEffect, useState } from 'react';
import { Search, X, Filter } from 'lucide-react';

interface ClientsFilterBarProps {
  busqueda: string;
  onCambioBusqueda: (valor: string) => void;
  tipoCliente?: 'B2C' | 'B2B';
  onCambioTipo: (tipo?: 'B2C' | 'B2B') => void;
  creditoHabilitado?: boolean;
  onCambioCredito: (credito?: boolean) => void;
  estado?: 'activo' | 'inactivo';
  onCambioEstado: (estado?: 'activo' | 'inactivo') => void;
  onLimpiarFiltros: () => void;
  hayFiltrosActivos: boolean;
}

export function ClientsFilterBar({
  busqueda,
  onCambioBusqueda,
  tipoCliente,
  onCambioTipo,
  creditoHabilitado,
  onCambioCredito,
  estado,
  onCambioEstado,
  onLimpiarFiltros,
  hayFiltrosActivos,
}: ClientsFilterBarProps) {
  const [inputLocal, setInputLocal] = useState(busqueda);

  useEffect(() => {
    setInputLocal(busqueda);
  }, [busqueda]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputLocal !== busqueda) {
        onCambioBusqueda(inputLocal);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [inputLocal, busqueda, onCambioBusqueda]);

  return (
    <div className="vidrio p-4 rounded-2xl border border-white/[0.08] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
      {/* Buscador */}
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={inputLocal}
          onChange={(e) => setInputLocal(e.target.value)}
          placeholder="Buscar por nombre, documento, correo o teléfono..."
          className="w-full pl-10 pr-9 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#e3b341]/60 transition-colors"
          aria-label="Buscar clientes"
        />
        {inputLocal && (
          <button
            type="button"
            onClick={() => {
              setInputLocal('');
              onCambioBusqueda('');
            }}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filtros selectores */}
      <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
        {/* Selector Tipo */}
        <select
          value={tipoCliente || ''}
          onChange={(e) =>
            onCambioTipo(e.target.value ? (e.target.value as 'B2C' | 'B2B') : undefined)
          }
          className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-slate-200 text-sm focus:outline-none focus:border-[#e3b341]/60 cursor-pointer"
          aria-label="Filtrar por tipo de cliente"
        >
          <option value="" className="bg-[#1a0b16] text-slate-200">
            Todos los tipos
          </option>
          <option value="B2B" className="bg-[#1a0b16] text-slate-200">
            Empresas (B2B)
          </option>
          <option value="B2C" className="bg-[#1a0b16] text-slate-200">
            Personas (B2C)
          </option>
        </select>

        {/* Selector Crédito */}
        <select
          value={
            creditoHabilitado === undefined ? '' : creditoHabilitado ? 'con_credito' : 'sin_credito'
          }
          onChange={(e) => {
            const v = e.target.value;
            onCambioCredito(v === 'con_credito' ? true : v === 'sin_credito' ? false : undefined);
          }}
          className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-slate-200 text-sm focus:outline-none focus:border-[#e3b341]/60 cursor-pointer"
          aria-label="Filtrar por estado crediticio"
        >
          <option value="" className="bg-[#1a0b16] text-slate-200">
            Todo crédito
          </option>
          <option value="con_credito" className="bg-[#1a0b16] text-slate-200">
            Con crédito activo
          </option>
          <option value="sin_credito" className="bg-[#1a0b16] text-slate-200">
            Sin crédito
          </option>
        </select>

        {/* Selector Estado */}
        <select
          value={estado || ''}
          onChange={(e) =>
            onCambioEstado(e.target.value ? (e.target.value as 'activo' | 'inactivo') : undefined)
          }
          className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-slate-200 text-sm focus:outline-none focus:border-[#e3b341]/60 cursor-pointer"
          aria-label="Filtrar por estado activo/inactivo"
        >
          <option value="" className="bg-[#1a0b16] text-slate-200">
            Todos los estados
          </option>
          <option value="activo" className="bg-[#1a0b16] text-slate-200">
            Activos
          </option>
          <option value="inactivo" className="bg-[#1a0b16] text-slate-200">
            Inactivos
          </option>
        </select>

        {/* Botón limpiar */}
        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={onLimpiarFiltros}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        )}
      </div>
    </div>
  );
}
