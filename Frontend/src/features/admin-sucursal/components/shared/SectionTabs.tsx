'use client';

/**
 * SectionTabs.tsx — Navegación horizontal por pestañas basada en rutas (Link + usePathname).
 *
 * - Usa los tokens de Glassmorphism Ejecutivo (`.vidrio-fuerte` / `.superficie-control`).
 * - Soporta scroll horizontal limpio en móvil.
 * - Incluye `aria-current="page"` en la pestaña activa para accesibilidad.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  isBranchRouteActive,
  type BranchTabItem,
} from '../../config/branch-navigation.config';

export interface SectionTabsProps {
  tabs: readonly BranchTabItem[];
  ariaLabel?: string;
  className?: string;
}

export function SectionTabs({
  tabs,
  ariaLabel = 'Secciones del módulo',
  className = '',
}: SectionTabsProps) {
  const pathname = usePathname() || '';

  return (
    <nav
      aria-label={ariaLabel}
      className={`w-full overflow-x-auto no-scrollbar ${className}`}
    >
      <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1.5 p-1.5 rounded-2xl superficie-control border border-border">
        {tabs.map((tab) => {
          const isActive = isBranchRouteActive(
            pathname,
            tab.href,
            Boolean(tab.exact),
          );

          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={`
                inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl
                text-xs font-sans transition-all whitespace-nowrap select-none
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60
                ${
                  isActive
                    ? 'bg-brand-600/15 dark:bg-brand-500/18 border border-brand-600/30 dark:border-brand-400/40 text-brand-700 dark:text-slate-100 font-semibold shadow-xs'
                    : 'border border-transparent text-text-muted font-medium hover:text-text hover:bg-slate-900/5 dark:hover:bg-white/6'
                }
              `}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-sans tabular-nums ${
                    isActive
                      ? 'bg-brand-600 text-btn-primario-texto font-semibold'
                      : 'bg-white/[0.06] text-text-muted font-medium'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
