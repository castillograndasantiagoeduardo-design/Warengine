/**
 * PageHeader.tsx — Título de sección con subtítulo y acciones a la derecha.
 */

import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  /** Enlace o migas de pan sobre el título. */
  back?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions, back }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back && <div className="mb-2 text-sm">{back}</div>}
        <h1 className="font-[family-name:var(--font-anton)] uppercase tracking-wider text-3xl text-white">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-white/60 font-[family-name:var(--font-archivo)] [font-variation-settings:'wdth'_95]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
