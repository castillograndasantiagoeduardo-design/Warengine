'use client';

/**
 * AdminSucursalLayout — Layout compartido para todas las rutas de /admin-sucursal/**.
 *
 * Responsabilidades:
 * 1. Verifica estado de sesión, rol RBAC (`esAdminSucursal`) y sucursal asignada (`usuario.sucursalId`).
 * 2. Monta `<BranchLayout>` (FondoAmbiental + BranchSidebar + BranchHeader) UNA sola vez.
 * 3. Gestiona el modal de perfil de administrador (`AdminProfileModal`) desde la barra superior.
 */

import React, { useState } from 'react';
import { useAuth, usePermissions } from '@/features/autenticacion';
import {
  BranchLayout,
  BranchAccessDenied,
  AdminProfileModal,
} from '@/features/admin-sucursal';
import { useBranchStaff } from '@/features/admin-sucursal/hooks';
import { Button3D } from '@/components/ui/Button3D';

export default function AdminSucursalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading: isAuthLoading, logout } = useAuth();
  const { usuario, esAdminSucursal, rolActual } = usePermissions();

  // 1. Estado de carga inicial de autenticación
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-brand-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500" />
          </span>
          <span className="text-xs font-medium text-text-muted">
            Iniciando sesión segura WarEngine...
          </span>
        </div>
      </div>
    );
  }

  // 2. Restricción estricta de rol (RBAC)
  if (!esAdminSucursal) {
    return <BranchAccessDenied rolActual={rolActual} onLogout={logout} />;
  }

  // 3. Sin sede asignada: error explícito (nunca se asume la Sede Principal)
  if (!usuario?.sucursalId) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl vidrio-fuerte border border-rose-500/30 text-center space-y-4">
          <h1 className="text-2xl font-titulos font-semibold text-text tracking-[-0.005em]">
            Sin sucursal asignada
          </h1>
          <p className="text-sm text-text-muted font-sans">
            Tu usuario no está vinculado a ninguna sucursal. Pide al super
            administrador que te asigne una sede antes de operar el panel.
          </p>
          <Button3D
            size="md"
            className="w-full justify-center"
            onClick={() => logout()}
          >
            Cerrar sesión
          </Button3D>
        </div>
      </div>
    );
  }

  return (
    <AdminSucursalShell
      sucursalId={usuario.sucursalId}
      sucursalNombre={
        usuario.sucursalNombre ?? `Sucursal #${usuario.sucursalId}`
      }
      email={usuario.email}
      rolNombre={rolActual || 'admin-sucursal'}
    >
      {children}
    </AdminSucursalShell>
  );
}

interface AdminSucursalShellProps {
  sucursalId: number;
  sucursalNombre: string;
  email: string;
  rolNombre: string;
  children: React.ReactNode;
}

function AdminSucursalShell({
  sucursalId,
  sucursalNombre,
  email,
  rolNombre,
  children,
}: AdminSucursalShellProps) {
  const { isAuthenticated } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { perfilAdmin, editarPerfilAdmin } = useBranchStaff({ sucursalId });

  return (
    <BranchLayout
      sucursalNombre={sucursalNombre}
      isOnline={isAuthenticated}
      onOpenProfile={() => setIsProfileModalOpen(true)}
    >
      {children}

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
