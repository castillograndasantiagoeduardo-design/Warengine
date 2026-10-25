'use client';

/**
 * BarList.tsx — Barras horizontales con etiqueta y valor directos (ranking, comparativos).
 *
 * Cada fila es enfocable y muestra el detalle secundario en hover/foco, y el valor
 * principal siempre está impreso: el tooltip nunca es la única forma de leer el dato.
 */

import React from 'react';

export interface BarListItem {
  key: string | number;
  label: string;
  value: number;
  /** Texto del valor ya formateado (ej. "$ 1.200.000"). */
  display: string;
  /** Detalle secundario (ej. "34 facturas · ticket $ 35.000"). */
  detail?: string;
  href?: string;
}

interface BarListProps {
  items: BarListItem[];
  color?: string;
  ariaLabel: string;
  renderLink?: (item: BarListItem, children: React.ReactNode) => React.ReactNode;
}

export function BarList({ items, color = '#e3b341', ariaLabel, renderLink }: BarListProps) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <ul aria-label={ariaLabel} className="flex flex-col gap-2">
      {items.map((item) => {
        const pct = Math.max(2, (Math.max(item.value, 0) / max) * 100);
        const fila = (
          <div className="group min-h-[44px] rounded-lg px-2 py-1.5 hover:bg-white/[0.04] focus-within:bg-white/[0.04]">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-white/85">{item.label}</span>
              <strong className="shrink-0 text-white">{item.display}</strong>
            </div>
            <div className="mt-1.5 h-2 w-full rounded-full bg-white/[0.06]">
              <div className="h-2 rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: color }} />
            </div>
            {item.detail && <p className="mt-1 text-[11px] text-white/50">{item.detail}</p>}
          </div>
        );
        return <li key={item.key}>{renderLink ? renderLink(item, fila) : fila}</li>;
      })}
    </ul>
  );
}
