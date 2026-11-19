'use client';

/**
 * PageHeader.tsx — Encabezado compartido para las vistas de Admin de Sucursal.
 *
 * Sigue la tipografía Ejecutiva (Plus Jakarta Sans + Inter) y tokens de tema
 * definidos en SKILL_SISTEMA_DISENO_WARENGINE.md:
 * - Izquierda: título h1 (`font-titulos font-semibold tracking-[-0.005em] text-text`)
 *   y descripción corta (`text-sm font-sans font-medium text-text-muted mt-1`).
 * - Derecha: slot de acciones (botones primarios/secundarios).
 */

import React from 'react';

export interface BranchPageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className = '',
}: BranchPageHeaderProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 pb-1 ${className}`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-titulos font-semibold tracking-[-0.005em] text-text">
            {title}
          </h1>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
        {description && (
          <p className="text-sm font-sans font-medium text-text-muted mt-1">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
