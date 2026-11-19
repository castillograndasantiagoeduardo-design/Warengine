'use client';

/**
 * /admin-sucursal/facturacion/cotizaciones — Aval y Gestión de Cotizaciones B2B.
 *
 * Permite al Administrador de Sucursal revisar cotizaciones generadas por Vendedores B2B,
 * verificar las existencias actuales en bodega de cada producto solicitado, avalar pedidos
 * con stock completo o rechazar cotizaciones inviables con motivo justificativo.
 */

import React from 'react';
import { useAuth } from '@/features/autenticacion';
import { BranchCotizacionesB2BPanel } from '@/features/admin-sucursal/components';

export default function CotizacionesB2BPage() {
  const { usuario } = useAuth();
  const sucursalId = usuario?.sucursalId || 1;

  return (
    <div className="space-y-6">
      <BranchCotizacionesB2BPanel sucursalId={sucursalId} />
    </div>
  );
}
