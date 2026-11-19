'use client';

/**
 * FilterBar.tsx — Contenedor compartido para barra de búsqueda, filtros y acciones de tabla.
 *
 * Reutiliza el contenedor base `<Tarjeta>` (`.vidrio`) del sistema de diseño WarEngine,
 * organizando los slots de búsqueda, filtros y acciones de forma responsive.
 */

import React from 'react';
import { Tarjeta } from '../Tarjeta';

export interface FilterBarProps {
  /** Control de búsqueda principal (izquierda). */
  search?: React.ReactNode;
  /** Selectores o píldoras de filtrado (centro/derecha). */
  filters?: React.ReactNode;
  /** Botones de acción secundaria de la tabla (extremo derecho). */
  actions?: React.ReactNode;
  /** Fila inferior opcional (ej. chips rápidos de estado o existencias). */
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  search,
  filters,
  actions,
  footer,
  children,
  className = '',
}: FilterBarProps) {
  return (
    <Tarjeta
      sinRelleno
      className={className}
      bodyClassName="p-4 sm:p-5 space-y-3"
    >
      {(search || filters || actions) && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {search && <div className="flex-1 min-w-0">{search}</div>}
          {(filters || actions) && (
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {filters}
              {actions}
            </div>
          )}
        </div>
      )}

      {children}

      {footer && (
        <div className="pt-3 border-t border-border flex flex-wrap items-center gap-2">
          {footer}
        </div>
      )}
    </Tarjeta>
  );
}
