'use client';

/**
 * DashboardPage — Selector de vista por rol en /dashboard.
 *
 * El shell (sidebar, header, sesión) lo pone dashboard/layout.tsx; aquí solo se
 * decide qué vista principal mostrar según el rol autenticado.
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/features/autenticacion';
import { SuperAdminDashboard } from '@/features/administracion';
import { EmptyState } from '@/components/ui/EmptyState';

export default function DashboardPage() {
  const router = useRouter();
  const { esSuperAdmin, esAdminSucursal } = usePermissions();

  useEffect(() => {
    if (esAdminSucursal) {
      router.replace('/admin-sucursal');
    }
  }, [esAdminSucursal, router]);

  if (esSuperAdmin) {
    return <SuperAdminDashboard />;
  }

  if (esAdminSucursal) {
    return (
      <div className="panel-card flex items-center justify-center p-8 text-white/70">
        <p>Redirigiendo al panel de administración de sucursal...</p>
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
