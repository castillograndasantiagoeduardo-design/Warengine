'use client';

import React from 'react';
import type { ResumenInventarioSede } from '../../types/branch-inventory.types';

interface InventoryKpiCardsProps {
  resumen?: ResumenInventarioSede;
  selectedNivel?: string;
  onSelectNivel: (nivel: 'todos' | 'optimo' | 'bajo' | 'agotado') => void;
  isLoading?: boolean;
}

export function InventoryKpiCards({
  resumen,
  selectedNivel = 'todos',
  onSelectNivel,
  isLoading = false,
}: InventoryKpiCardsProps) {
  const total = resumen?.total ?? 0;
  const optimo = resumen?.optimo ?? 0;
  const bajo = resumen?.bajo ?? 0;
  const agotado = resumen?.agotado ?? 0;

  const cards = [
    {
      id: 'todos' as const,
      label: 'Total productos',
      value: total,
      color: 'text-white',
      accentColor: 'bg-rose-500',
      activeRing: 'border-rose-500/50 shadow-rose-500/10',
    },
    {
      id: 'optimo' as const,
      label: 'Óptimo',
      value: optimo,
      color: 'text-emerald-400',
      accentColor: 'bg-emerald-500',
      activeRing: 'border-emerald-500/50 shadow-emerald-500/10',
    },
    {
      id: 'bajo' as const,
      label: 'Stock bajo',
      value: bajo,
      color: 'text-amber-400',
      accentColor: 'bg-amber-500',
      activeRing: 'border-amber-500/50 shadow-amber-500/10',
    },
    {
      id: 'agotado' as const,
      label: 'Agotado',
      value: agotado,
      color: 'text-red-400',
      accentColor: 'bg-red-500',
      activeRing: 'border-red-500/50 shadow-red-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => {
        const isSelected = selectedNivel === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelectNivel(c.id)}
            className={`vidrio relative rounded-2xl p-4 text-left transition-all duration-200 cursor-pointer group ${
              isSelected
                ? `${c.activeRing} ring-2 ring-white/10 bg-white/[0.06]`
                : 'hover:bg-white/[0.04]'
            }`}
          >
            <div className="text-xs text-white/60 font-medium mb-1 tracking-wide">
              {c.label}
            </div>
            <div className="text-2xl md:text-3xl font-bold font-mono tabular-nums text-white">
              {isLoading ? (
                <span className="inline-block w-12 h-8 bg-white/10 rounded animate-pulse" />
              ) : (
                c.value
              )}
            </div>
            <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full ${c.accentColor} rounded-full transition-all duration-300`}
                style={{
                  width: total > 0 ? `${Math.min(100, Math.max(12, (c.value / total) * 100))}%` : '0%',
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
