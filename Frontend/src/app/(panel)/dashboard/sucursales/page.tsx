'use client';

/**
 * /dashboard/sucursales — Gestión de sucursales (Super Admin).
 */

import { PERMISSIONS } from '@warengine/contracts';
import { RequierePermiso } from '@/components/panel/RequierePermiso';
import { SucursalesView } from '@/features/administracion/components/sucursales/SucursalesView';

export default function SucursalesPage() {
  return (
    <RequierePermiso permiso={PERMISSIONS.ADMIN_GESTIONAR_SUCURSALES}>
      <SucursalesView />
    </RequierePermiso>
  );
}
