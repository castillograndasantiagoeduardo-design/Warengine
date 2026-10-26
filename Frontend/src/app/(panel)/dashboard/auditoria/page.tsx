'use client';

/**
 * /dashboard/auditoria — Visor de auditoría (RF-ADM-C11, C20).
 */

import { RequierePermiso } from '@/components/panel/RequierePermiso';
import { AuditoriaView } from '@/features/administracion/components/auditoria/AuditoriaView';
import { PERMISOS_ADMIN } from '@/features/administracion/permisos';

export default function AuditoriaPage() {
  return (
    <RequierePermiso permiso={PERMISOS_ADMIN.verAuditoria}>
      <AuditoriaView />
    </RequierePermiso>
  );
}
