'use client';

/**
 * Estados estándar compartidos (EmptyState, LoadingState, ErrorState y ModuleUnderConstruction)
 * para las vistas del módulo Administrador de Sucursal.
 *
 * Reutilizan el contenedor base `<Tarjeta>` (`.vidrio`), el componente `<Skeleton>` de `@/components/ui/Skeleton`
 * y la tipografía Ejecutiva (Plus Jakarta Sans + Inter).
 */

import React from 'react';
import { Inbox, AlertTriangle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tarjeta } from '../Tarjeta';
import { PageHeader } from './PageHeader';

export interface BranchEmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = '',
}: BranchEmptyStateProps) {
  return (
    <Tarjeta className={className}>
      <div className="py-12 px-6 text-center max-w-md mx-auto flex flex-col items-center gap-3.5">
        <div
          className="w-12 h-12 rounded-2xl bg-brand-100 border border-brand-200 text-brand-700 dark:bg-brand-500/15 dark:border-brand-400/20 dark:text-brand-300 flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          {icon ?? <Inbox className="w-5 h-5" />}
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-titulos font-semibold text-text tracking-normal">
            {title}
          </h3>
          {description && (
            <p className="text-xs font-sans font-normal text-text-muted leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {action && <div className="pt-1">{action}</div>}
      </div>
    </Tarjeta>
  );
}

export interface BranchLoadingStateProps {
  /** Número de filas de esqueleto a mostrar. */
  rows?: number;
  title?: string;
  className?: string;
}

export function LoadingState({
  rows = 5,
  title = 'Cargando información de la sucursal...',
  className = '',
}: BranchLoadingStateProps) {
  return (
    <Tarjeta className={className} aria-busy="true" aria-live="polite">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-5 w-48 rounded-lg" />
          <Skeleton className="h-4 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-11 w-full rounded-xl" lines={rows} />
        <p className="sr-only">{title}</p>
      </div>
    </Tarjeta>
  );
}

export interface BranchErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'No se pudo cargar la información',
  message,
  onRetry,
  retryLabel = 'Reintentar',
  className = '',
}: BranchErrorStateProps) {
  return (
    <Tarjeta className={className} role="alert">
      <div className="py-10 px-6 text-center max-w-md mx-auto flex flex-col items-center gap-3.5">
        <div
          className="w-12 h-12 rounded-2xl bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/12 dark:text-red-300 dark:border-red-500/25 flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-titulos font-semibold text-text tracking-normal">
            {title}
          </h3>
          <p className="text-xs font-sans font-normal text-text-muted leading-relaxed">
            {message}
          </p>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-xl superficie-control text-xs font-sans font-medium text-text hover:bg-slate-900/5 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-brand-500" />
            <span>{retryLabel}</span>
          </button>
        )}
      </div>
    </Tarjeta>
  );
}

export interface ModuleUnderConstructionProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
}

/**
 * Vista estándar "En construcción" para módulos cuyas pantallas se diseñarán en fases posteriores
 * (Clientes, Activos, Reportes, Configuración).
 */
export function ModuleUnderConstruction({
  title,
  subtitle = 'Gestión operativa de la sucursal',
  icon,
}: ModuleUnderConstructionProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={subtitle} />
      <EmptyState
        icon={icon}
        title={title}
        description="Esta sección está en desarrollo"
      />
    </div>
  );
}
