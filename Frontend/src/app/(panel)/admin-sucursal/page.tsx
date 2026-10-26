'use client';

/**
 * DashboardPage — Panel de control operativo y analítico para Admin de Sucursal (WarEngine).
 *
 * Principios SOLID:
 * - Single Responsibility (SRP): Coordina exclusivamente el enrutamiento visual de la sede.
 * - Open/Closed (OCP): Modularidad desacoplada por vistas especializadas sin inflar la página maestra.
 * - Dependency Inversion (DIP): Se nutre de hooks desacoplados (useAuth, usePermissions, useBranchDashboard).
 *
 * La sede SIEMPRE sale de la sesión (empleados.sucursal_id). Si el usuario no tiene sede,
 * se muestra un error: nunca se asume la Sede Principal.
 */

import React, { useState } from 'react';
import { useAuth, usePermissions } from '@/features/autenticacion';
import {
  BranchLayout,
  BranchSection,
  DashboardSkeleton,
  BranchOverviewView,
  BranchInventoryView,
  BranchMovementsView,
  BranchSuppliersView,
  BranchStaffView,
  BranchInvoicingView,
  AdminProfileModal,
  BranchAccessDenied,
} from '@/features/admin-sucursal';
import { useBranchDashboard, useBranchStaff } from '@/features/admin-sucursal/hooks';
import { Button3D } from '@/components/ui/Button3D';

export default function DashboardPage() {
  const { isLoading: isAuthLoading, logout } = useAuth();
  const { usuario, esAdminSucursal, rolActual } = usePermissions();

  // 1. Estado de carga inicial de autenticación
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0d1630] flex items-center justify-center text-[#e3b341] font-[family-name:var(--font-pixelify)]">
        <div className="flex flex-col items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e3b341] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#e3b341]" />
          </span>
          <span>Iniciando sesión segura WarEngine...</span>
        </div>
      </div>
    );
  }

  // 2. RESTRICCIÓN ESTRICTA DE ROL (RBAC): Delegado a componente de seguridad especializado
  if (!esAdminSucursal) {
    return <BranchAccessDenied rolActual={rolActual} onLogout={logout} />;
  }

  // 3. Sin sede asignada: error explícito (no se cargan datos de ninguna sucursal)
  if (!usuario?.sucursalId) {
    return (
      <div className="min-h-screen bg-[#0d1630] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#111d3f]/90 border border-rose-500/30 text-center space-y-4">
          <h1 className="text-2xl font-[family-name:var(--font-anton)] text-white tracking-wide uppercase">
            Sin sucursal asignada
          </h1>
          <p className="text-sm text-slate-300 font-[family-name:var(--font-archivo)]">
            Tu usuario no está vinculado a ninguna sucursal. Pide al super administrador que te asigne una
            sede antes de operar el panel.
          </p>
          <Button3D size="md" className="w-full justify-center" onClick={() => logout()}>
            Cerrar sesión
          </Button3D>
        </div>
      </div>
    );
  }

  return (
    <PanelSucursal
      sucursalId={usuario.sucursalId}
      sucursalNombre={usuario.sucursalNombre ?? `Sucursal #${usuario.sucursalId}`}
      email={usuario.email}
      rolNombre={rolActual || 'admin-sucursal'}
    />
  );
}

interface PanelSucursalProps {
  sucursalId: number;
  sucursalNombre: string;
  email: string;
  rolNombre: string;
}

function PanelSucursal({ sucursalId, sucursalNombre, email, rolNombre }: PanelSucursalProps) {
  const { isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState<BranchSection>('resumen');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Hook de personal de sede para datos del perfil de administrador
  const { perfilAdmin, editarPerfilAdmin } = useBranchStaff({ sucursalId });

  // Hook desacoplado para gestión de datos de sede usando la sucursal del usuario
  const {
    data,
    isLoading: isDashboardLoading,
    error: dashboardError,
    periodo,
    cambiarPeriodo,
  } = useBranchDashboard({
    sucursalId,
    sucursalNombre,
    periodoInicial: 'hoy',
    autoRefreshIntervalMs: 60000,
  });

  return (
    <BranchLayout
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      periodo={periodo}
      onPeriodoChange={cambiarPeriodo}
      sucursalNombre={sucursalNombre}
      ultimaSincronizacion={data?.ultimaSincronizacion}
      isOnline={isAuthenticated}
      onOpenProfile={() => setIsProfileModalOpen(true)}
    >
      {activeSection === 'inventario' ? (
        <BranchInventoryView sucursalId={sucursalId} sucursalNombre={sucursalNombre} />
      ) : activeSection === 'movimientos' ? (
        <BranchMovementsView sucursalId={sucursalId} sucursalNombre={sucursalNombre} />
      ) : activeSection === 'proveedores' ? (
        <BranchSuppliersView />
      ) : activeSection === 'cajeros' ? (
        <BranchStaffView sucursalId={sucursalId} sucursalNombre={sucursalNombre} />
      ) : activeSection === 'facturacion' ? (
        <BranchInvoicingView sucursalId={sucursalId} sucursalNombre={sucursalNombre} />
      ) : isDashboardLoading && !data ? (
        <DashboardSkeleton />
      ) : data ? (
        <BranchOverviewView data={data} onNavigateSection={setActiveSection} />
      ) : dashboardError ? (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-sm text-rose-200">
          No se pudo cargar el resumen de la sucursal: {dashboardError}
        </div>
      ) : null}

      {/* Modal de Perfil de Administrador de Sucursal */}
      <AdminProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        perfil={perfilAdmin}
        email={email}
        rolNombre={rolNombre}
        onGuardarContacto={editarPerfilAdmin}
      />
    </BranchLayout>
  );
}
