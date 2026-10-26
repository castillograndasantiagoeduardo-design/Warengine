'use client';

/**
 * RequierePermiso.tsx — Guardia de vista por permiso RBAC.
 *
 * Es una capa de UX: el backend vuelve a validar cada endpoint (403 PERMISO_DENEGADO).
 *
 *   <RequierePermiso permiso={PERMISSIONS.ADMIN_GESTIONAR_SUCURSALES}>
 *     <SucursalesView />
 *   </RequierePermiso>
 */

import React from 'react';
import { usePermissions } from '@/features/autenticacion';
import { Forbidden } from './Forbidden';

interface RequierePermisoProps {
  /** Si es un arreglo basta con tener cualquiera. */
  permiso: string | string[];
  children: React.ReactNode;
}

export function RequierePermiso({ permiso, children }: RequierePermisoProps) {
  const { tieneCualquieraPermisos } = usePermissions();
  const requeridos = Array.isArray(permiso) ? permiso : [permiso];

  if (!tieneCualquieraPermisos(requeridos)) return <Forbidden />;
  return <>{children}</>;
}
