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
      <div className="panel-card max-w-lg mx-auto p-8 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E9B949]/20 border border-[#E9B949]/40 text-[#E9B949] flex items-center justify-center text-3xl shadow-lg">
          💼
        </div>
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-[family-name:var(--font-anton)]">
            Terminal de Ventas B2B
          </h2>
          <p className="text-xs text-white/70 mt-1">
            Redirigiendo a tu estación de cotizaciones y facturación corporativa...
          </p>
        </div>
        <button
          onClick={() => router.push('/vendedor-b2b')}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E9B949] to-[#b88a1f] text-[#14213D] font-bold text-xs uppercase tracking-wider hover:brightness-110 cursor-pointer shadow transition-all"
        >
          Abrir Terminal de Ventas B2B &rarr;
        </button>
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
