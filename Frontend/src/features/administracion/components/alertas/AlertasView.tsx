'use client';

/**
 * AlertasView.tsx — Alertas administrativas y de stock en dos pestañas.
 */

import { useState } from 'react';
import { PERMISSIONS } from '@warengine/contracts';
import { PageHeader } from '@/components/panel/PageHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { usePermissions } from '@/features/autenticacion';
import { AlertasAdminPanel } from './AlertasAdminPanel';
import { AlertasStockPanel } from './AlertasStockPanel';
import { CreditosB2BPendientesPanel } from './CreditosB2BPendientesPanel';

type Pestana = 'admin' | 'stock' | 'creditos';

export function AlertasView() {
  const [pestana, setPestana] = useState<Pestana>('admin');
  const { tienePermiso } = usePermissions();
  const puedeAprobarCredito = tienePermiso(PERMISSIONS.FACTURACION_APROBAR_CREDITO_B2B);

  const pestanas: { value: Pestana; label: string }[] = [
    { value: 'admin', label: 'Administrativas' },
    { value: 'stock', label: 'Stock bajo' },
    ...(puedeAprobarCredito ? [{ value: 'creditos' as const, label: 'Créditos B2B' }] : []),
  ];

  return (
    <div>
      <PageHeader
        title="Alertas"
        subtitle="Requerimientos de las sedes, productos por reabastecer y aprobaciones de crédito B2B"
        actions={<SegmentedControl ariaLabel="Tipo de alerta" options={pestanas} value={pestana} onChange={setPestana} />}
      />
      {pestana === 'admin' ? (
        <AlertasAdminPanel />
      ) : pestana === 'stock' ? (
        <AlertasStockPanel />
      ) : (
        <CreditosB2BPendientesPanel />
      )}
    </div>
  );
}
