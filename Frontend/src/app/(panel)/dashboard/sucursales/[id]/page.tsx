'use client';

/**
 * /dashboard/sucursales/[id] — Ficha de detalle de una sucursal (Super Admin).
 */

import { useParams } from 'next/navigation';
import { PERMISSIONS } from '@warengine/contracts';
import { RequierePermiso } from '@/components/panel/RequierePermiso';
import { SucursalDetalleView } from '@/features/administracion/components/sucursales/detalle/SucursalDetalleView';

export default function SucursalDetallePage() {
  const { id } = useParams<{ id: string }>();

  return (
    <RequierePermiso permiso={PERMISSIONS.ADMIN_GESTIONAR_SUCURSALES}>
      <SucursalDetalleView id={Number(id)} />
    </RequierePermiso>
  );
}
