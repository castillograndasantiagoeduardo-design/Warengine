'use client';

/**
 * SectionCard.tsx — Tarjeta de sección con título, acciones y estados de carga/error/vacío.
 *
 * Centraliza el patrón "si carga → skeleton, si falla → reintentar, si está vacío → EmptyState".
 */

import React from 'react';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { Button3D } from './Button3D';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  subtitle,
  actions,
  loading,
  error,
  onRetry,
  isEmpty,
  emptyTitle = 'Sin datos',
  emptyDescription,
  children,
  className = '',
}: SectionCardProps) {
  let contenido: React.ReactNode = children;
  if (loading) {
    contenido = <Skeleton className="h-6 w-full" lines={5} />;
  } else if (error) {
    contenido = (
      <EmptyState
        icon="⚠"
        title="No se pudo cargar"
        description={error}
        action={
          onRetry && (
            <Button3D size="panel-sm" variant="navy" type="button" onClick={onRetry}>
              Reintentar
            </Button3D>
          )
        }
      />
    );
  } else if (isEmpty) {
    contenido = <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <section className={`panel-card p-5 ${className}`}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-anton)] uppercase tracking-wider text-lg text-white">{title}</h2>
          {subtitle && <p className="text-xs text-white/55">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {contenido}
    </section>
  );
}
