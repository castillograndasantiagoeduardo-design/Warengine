'use client';

/**
 * /dashboard/empleados — Directorio de personal y salarios.
 */

import { PERMISSIONS } from '@warengine/contracts';
import { RequierePermiso } from '@/components/panel/RequierePermiso';
import { EmpleadosView } from '@/features/administracion/components/empleados/EmpleadosView';

export default function EmpleadosPage() {
  return (
    <RequierePermiso permiso={PERMISSIONS.ADMIN_GESTIONAR_PERSONAL}>
      <EmpleadosView />
    </RequierePermiso>
  );
}
