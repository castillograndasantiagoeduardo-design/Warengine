'use client';

import React from 'react';
import { formatCOP } from '@/lib/format/moneda';
import type { ActivosResumen, EstadoActivo } from '../../types/branch-assets.types';

interface AssetSummaryChipsProps {
  resumen?: ActivosResumen | null;
  estadoSeleccionado?: EstadoActivo;
  onSelectEstado: (estado: string) => void;
}

export function AssetSummaryChips({
  resumen,
  estadoSeleccionado,
  onSelectEstado,
}: AssetSummaryChipsProps) {
  if (!resumen) return null;

  const chips: Array<{
    id: EstadoActivo | 'todos';
    label: string;
    count: number;
    color: string;
    activeBorder: string;
    dotColor: string;
  }> = [
    {
      id: 'todos',
      label: 'Total activos',
      count: resumen.total,
      color: 'text-neutral-200',
      activeBorder: 'border-white/30 bg-white/10',
      dotColor: 'bg-neutral-400',
    },
    {
      id: 'disponible',
      label: 'Disponibles',
      count: resumen.disponibles,
      color: 'text-emerald-300',
      activeBorder: 'border-emerald-500/50 bg-emerald-500/10',
      dotColor: 'bg-emerald-400',
    },
    {
      id: 'asignado',
      label: 'Asignados',
      count: resumen.asignados,
      color: 'text-sky-300',
      activeBorder: 'border-sky-500/50 bg-sky-500/10',
      dotColor: 'bg-sky-400',
    },
    {
      id: 'mantenimiento',
      label: 'En mantenimiento',
      count: resumen.enMantenimiento,
      color: 'text-amber-300',
      activeBorder: 'border-amber-500/50 bg-amber-500/10',
      dotColor: 'bg-amber-400',
    },
    {
      id: 'baja',
      label: 'De baja',
      count: resumen.deBaja,
      color: 'text-rose-300',
      activeBorder: 'border-rose-500/50 bg-rose-500/10',
      dotColor: 'bg-rose-400',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {chips.map((chip) => {
        const isActive =
          chip.id === 'todos' ? !estadoSeleccionado : estadoSeleccionado === chip.id;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onSelectEstado(chip.id === 'todos' ? '' : chip.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
              isActive
                ? `${chip.activeBorder} shadow-sm`
                : 'border-white/5 bg-white/[0.02] text-neutral-400 hover:border-white/10 hover:text-neutral-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${chip.dotColor}`} />
            <span>{chip.label}</span>
            <span className={`font-semibold ${isActive ? chip.color : 'text-neutral-300'}`}>
              {chip.count}
            </span>
          </button>
        );
      })}

      {resumen.valorTotal > 0 && (
        <div className="ml-auto flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/5 bg-white/[0.02] text-xs">
          <span className="text-neutral-400">Valor patrimonial:</span>
          <span className="font-mono font-semibold text-neutral-100">
            {formatCOP(resumen.valorTotal)}
          </span>
        </div>
      )}
    </div>
  );
}
