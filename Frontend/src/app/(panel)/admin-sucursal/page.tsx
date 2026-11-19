'use client';

/**
 * /admin-sucursal — Vista principal del Dashboard de Administrador de Sucursal.
 *
 * El marco común (BranchLayout, guardias de sesión/rol y sucursal asignada)
 * es provisto por `src/app/(panel)/admin-sucursal/layout.tsx`.
 */

import React, { useEffect } from 'react';
import { usePermissions } from '@/features/autenticacion';
import {
  DashboardSkeleton,
  BranchOverviewView,
  useBranchLayoutPeriodo,
  ErrorState,
} from '@/features/admin-sucursal';
import { useBranchDashboard } from '@/features/admin-sucursal/hooks';

export default function AdminSucursalDashboardPage() {
  const { usuario } = usePermissions();
  const { periodo: layoutPeriodo } = useBranchLayoutPeriodo();

  const sucursalId = usuario?.sucursalId ?? 0;
  const sucursalNombre =
    usuario?.sucursalNombre ?? `Sucursal #${sucursalId}`;

  const {
    data,
    isLoading,
    error,
    periodo,
    cambiarPeriodo,
    recargar,
  } = useBranchDashboard({
    sucursalId,
    sucursalNombre,
    periodoInicial: layoutPeriodo,
    autoRefreshIntervalMs: 60000,
  });

  // Sincroniza el selector de período del BranchHeader con el hook del dashboard
  useEffect(() => {
    if (layoutPeriodo !== periodo) {
      cambiarPeriodo(layoutPeriodo);
    }
  }, [layoutPeriodo, periodo, cambiarPeriodo]);

  if (isLoading && !data) {
    return <DashboardSkeleton />;
  }

  if (data) {
    return <BranchOverviewView data={data} />;
  }

  if (error) {
    return (
      <ErrorState
        title="No se pudo cargar el resumen de la sucursal"
        message={error}
        onRetry={recargar}
      />
    );
  }

  return null;
}
