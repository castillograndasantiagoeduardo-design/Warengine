'use client';

/**
 * /admin-sucursal/inventario/movimientos — Pestaña de Movimientos y Kardex de sede.
 */

import React from 'react';
import { usePermissions } from '@/features/autenticacion';
import { BranchMovementsView } from '@/features/admin-sucursal';

export default function AdminSucursalInventarioMovimientosPage() {
  const { usuario } = usePermissions();
  if (!usuario?.sucursalId) return null;

  return (
    <BranchMovementsView
      sucursalId={usuario.sucursalId}
      sucursalNombre={
        usuario.sucursalNombre ?? `Sucursal #${usuario.sucursalId}`
      }
    />
  );
}
