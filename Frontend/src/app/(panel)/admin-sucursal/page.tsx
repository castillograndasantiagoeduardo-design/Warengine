'use client';

/**
 * DashboardPage — Panel de control operativo y analítico para Admin de Sucursal (WarEngine).
 *
 * Principios SOLID:
 * - Single Responsibility (SRP): Coordina exclusivamente el enrutamiento visual de la sede.
 * - Open/Closed (OCP): Modularidad desacoplada por vistas especializadas sin inflar la página maestra.
 * - Dependency Inversion (DIP): Se nutre de hooks desacoplados (useAuth, usePermissions, useBranchDashboard).
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

export default function DashboardPage() {
  const { isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { usuario, esAdminSucursal, rolActual } = usePermissions();
  const [activeSection, setActiveSection] = useState<BranchSection>('resumen');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Hook de personal de sede para datos del perfil de administrador
  const { perfilAdmin, editarPerfilAdmin } = useBranchStaff({
    sucursalId: usuario?.sucursalId ?? 1,
  });

  // Hook desacoplado para gestión de datos de sede usando la sucursal del usuario
  const {
    data,
    isLoading: isDashboardLoading,
    periodo,
    cambiarPeriodo,
  } = useBranchDashboard({
    sucursalId: usuario?.sucursalId ?? 1,
    periodoInicial: 'hoy',
    autoRefreshIntervalMs: 60000,
  });

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

  // 3. Layout Maestro y Coordinador de Vistas de Sede
  return (
    <BranchLayout
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      periodo={periodo}
      onPeriodoChange={cambiarPeriodo}
      sucursalNombre={data?.sucursalNombre || 'Sede Norte'}
      ultimaSincronizacion={data?.ultimaSincronizacion || '17:42:08'}
      isOnline={isAuthenticated}
      onOpenProfile={() => setIsProfileModalOpen(true)}
    >
      {activeSection === 'inventario' ? (
        <BranchInventoryView
          sucursalId={usuario?.sucursalId ?? 1}
          sucursalNombre={data?.sucursalNombre || 'Sede Norte'}
        />
      ) : activeSection === 'movimientos' ? (
        <BranchMovementsView
          sucursalId={usuario?.sucursalId ?? 1}
          sucursalNombre={data?.sucursalNombre || 'Sede Norte'}
        />
      ) : activeSection === 'proveedores' ? (
        <BranchSuppliersView />
      ) : activeSection === 'cajeros' ? (
        <BranchStaffView
          sucursalId={usuario?.sucursalId ?? 1}
          sucursalNombre={data?.sucursalNombre || 'Sede Norte'}
        />
      ) : activeSection === 'facturacion' ? (
        <BranchInvoicingView
          sucursalId={usuario?.sucursalId ?? 1}
          sucursalNombre={data?.sucursalNombre || 'Sede Norte'}
        />
      ) : isDashboardLoading && !data ? (
        <DashboardSkeleton />
      ) : data ? (
        <BranchOverviewView
          data={data}
          onNavigateSection={setActiveSection}
        />
      ) : null}

      {/* Modal de Perfil de Administrador de Sucursal */}
      <AdminProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        perfil={perfilAdmin}
        email={usuario?.email}
        rolNombre={rolActual || 'admin-sucursal'}
        onGuardarContacto={editarPerfilAdmin}
      />
    </BranchLayout>
  );
}
