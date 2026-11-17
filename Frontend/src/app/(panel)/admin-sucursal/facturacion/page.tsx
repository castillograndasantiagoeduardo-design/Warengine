'use client';

/**
 * /admin-sucursal/facturacion — Vista de supervisión de facturación y centro de alertas.
 */

import React from 'react';
import { usePermissions } from '@/features/autenticacion';
import { BranchInvoicingView } from '@/features/admin-sucursal';

export default function AdminSucursalFacturacionPage() {
  const { usuario } = usePermissions();
  if (!usuario?.sucursalId) return null;

  return (
    <BranchInvoicingView
      sucursalId={usuario.sucursalId}
      sucursalNombre={
        usuario.sucursalNombre ?? `Sucursal #${usuario.sucursalId}`
      }
    />
  );
}
