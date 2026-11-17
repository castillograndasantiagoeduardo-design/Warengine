'use client';

/**
 * /admin-sucursal/inventario — Pestaña de Productos y existencias de sede.
 */

import React from 'react';
import { usePermissions } from '@/features/autenticacion';
import { BranchInventoryView } from '@/features/admin-sucursal';

export default function AdminSucursalInventarioProductosPage() {
  const { usuario } = usePermissions();
  if (!usuario?.sucursalId) return null;

  return (
    <BranchInventoryView
      sucursalId={usuario.sucursalId}
      sucursalNombre={
        usuario.sucursalNombre ?? `Sucursal #${usuario.sucursalId}`
      }
    />
  );
}
