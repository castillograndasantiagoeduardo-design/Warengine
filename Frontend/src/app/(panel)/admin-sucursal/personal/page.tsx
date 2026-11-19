'use client';

/**
 * /admin-sucursal/personal — Vista de gestión de personal de sede y supervisión de turnos POS.
 */

import React from 'react';
import { usePermissions } from '@/features/autenticacion';
import { BranchStaffView } from '@/features/admin-sucursal';

export default function AdminSucursalPersonalPage() {
  const { usuario } = usePermissions();
  if (!usuario?.sucursalId) return null;

  return (
    <BranchStaffView
      sucursalId={usuario.sucursalId}
      sucursalNombre={
        usuario.sucursalNombre ?? `Sucursal #${usuario.sucursalId}`
      }
    />
  );
}
