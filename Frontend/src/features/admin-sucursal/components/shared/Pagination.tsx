'use client';

/**
 * Pagination.tsx — Control de paginación presentacional para las tablas de Admin de Sucursal.
 *
 * Sigue la misma interfaz de `components/ui/Pagination.tsx` (`page`, `totalPages`, `total`, `onPageChange`),
 * adaptado a los tokens de tema claro/oscuro y números tabulares del sistema de diseño Ejecutivo.
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface BranchPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  total,
  className = '',
}: BranchPaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <nav
      aria-label="Paginación"
      className={`px-5 py-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs font-sans ${className}`}
    >
      <span className="text-text-muted font-medium tabular-nums">
        Página <span className="font-semibold text-text">{page}</span> de{' '}
        <span className="font-semibold text-text">{safeTotalPages}</span>
        {total !== undefined && (
          <>
            {' '}
            · <span className="font-semibold text-text">{total}</span> registros
          </>
        )}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl superficie-control text-xs font-sans font-medium text-text hover:bg-slate-900/5 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Anterior</span>
        </button>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= safeTotalPages}
          aria-label="Página siguiente"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl superficie-control text-xs font-sans font-medium text-text hover:bg-slate-900/5 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <span>Siguiente</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </nav>
  );
}
