'use client';

/**
 * Insignia.tsx — Badge semántico oficial WarEngine.
 *
 * Utiliza colores de estado fijos (success, warning, danger, info, neutral, brand)
 * con ring-1 ring-inset, tipografía sans/mono y soporte de iconos o puntos de estado.
 */

import React from 'react';

export type VarianteInsignia =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'brand';

export interface InsigniaProps {
  children: React.ReactNode;
  variante?: VarianteInsignia;
  icono?: React.ReactNode;
  conPunto?: boolean;
  tamano?: 'sm' | 'md';
  className?: string;
}

const ESTILOS_VARIANTE: Record<VarianteInsignia, string> = {
  success:
    'bg-green-50 text-green-700 dark:bg-green-500/12 dark:text-green-300 ring-1 ring-inset ring-green-600/25',
  warning:
    'bg-amber-50 text-amber-800 dark:bg-amber-500/12 dark:text-amber-300 ring-1 ring-inset ring-amber-600/25',
  danger:
    'bg-red-50 text-red-700 dark:bg-red-500/12 dark:text-red-300 ring-1 ring-inset ring-red-600/25',
  info:
    'bg-sky-50 text-sky-700 dark:bg-sky-500/12 dark:text-sky-300 ring-1 ring-inset ring-sky-600/25',
  neutral:
    'bg-slate-100 text-slate-700 dark:bg-white/[0.04] dark:text-text-muted ring-1 ring-inset ring-border',
  brand:
    'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 ring-1 ring-inset ring-brand-500/30',
};

const PUNTOS_VARIANTE: Record<VarianteInsignia, string> = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-sky-500',
  neutral: 'bg-text-muted',
  brand: 'bg-brand-500',
};

export function Insignia({
  children,
  variante = 'neutral',
  icono,
  conPunto = false,
  tamano = 'sm',
  className = '',
}: InsigniaProps) {
  const claseTamano =
    tamano === 'sm'
      ? 'text-[11px] px-2 py-0.5 gap-1.5'
      : 'text-xs px-2.5 py-1 gap-2';

  return (
    <span
      className={`
        inline-flex items-center font-sans font-medium rounded-md
        whitespace-nowrap transition-colors select-none
        ${ESTILOS_VARIANTE[variante]}
        ${claseTamano}
        ${className}
      `}
    >
      {conPunto && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${PUNTOS_VARIANTE[variante]}`}
        />
      )}
      {icono && <span className="shrink-0">{icono}</span>}
      <span className="tabular-nums">{children}</span>
    </span>
  );
}

