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
  const { esSuperAdmin, esAdminSucursal, esVendedorB2B } = usePermissions();

  useEffect(() => {
    if (esAdminSucursal) {
      router.replace('/admin-sucursal');
    } else if (esVendedorB2B) {
      router.replace('/vendedor-b2b');
    }
  }, [esAdminSucursal, esVendedorB2B, router]);

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

  if (esVendedorB2B) {
    return (
      <div className="panel-card flex items-center justify-center p-8 text-white/70">
        <p>Redirigiendo a la terminal de ventas B2B...</p>
      </div>
    );
  }

  // Otros roles sin vista asignada
  return (
    <div className="panel-card">
      <EmptyState
        title="Módulo en fase de activación"
        description="No hay una vista asignada para su perfil en este panel."
      />
    </div>
  );
}
