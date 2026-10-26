'use client';

/**
 * DashboardPage — Selector de vista por rol en /dashboard.
 *
 * El shell (sidebar, header, sesión) lo pone dashboard/layout.tsx; aquí solo se
 * decide qué vista principal mostrar según el rol autenticado.
 */

import React from 'react';
import { usePermissions } from '@/features/autenticacion';
import { SuperAdminDashboard } from '@/features/administracion';
import { EmptyState } from '@/components/ui/EmptyState';

export default function DashboardPage() {
  const { esSuperAdmin, esAdminSucursal } = usePermissions();

  if (esSuperAdmin) {
    return <SuperAdminDashboard />;
  }

  if (esAdminSucursal) {
    // ─── PUNTO DE MONTAJE: vista del Admin de Sucursal ───────────────
    // Reemplazar este bloque por el componente de su feature, p. ej.:
    //   return <AdminSucursalDashboard />;
    return (
      <div className="panel-card">
        <EmptyState title="Panel de sucursal" description="La vista del administrador de sucursal se monta aquí." />
      </div>
    );
  }

  // vendedor-b2b u otros roles sin vista asignada (fuera del alcance de la demo)
  return (
    <div className="panel-card">
      <EmptyState
        title="Módulo en fase de activación"
        description="El módulo para ventas mayoristas (B2B) estará disponible próximamente."
      />
    </div>
  );
}
