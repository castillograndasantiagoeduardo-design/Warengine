'use client';

/**
 * /dashboard/alertas — Alertas administrativas y de stock.
 */

import { RequierePermiso } from '@/components/panel/RequierePermiso';
import { AlertasView } from '@/features/administracion/components/alertas/AlertasView';
import { PERMISOS_ADMIN } from '@/features/administracion/permisos';

export default function AlertasPage() {
  return (
    <RequierePermiso permiso={PERMISOS_ADMIN.gestionarAlertas}>
      <AlertasView />
    </RequierePermiso>
  );
}
