'use client';

/**
 * AlertasView.tsx — Alertas administrativas y de stock en dos pestañas.
 */

import { useState } from 'react';
import { PageHeader } from '@/components/panel/PageHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { AlertasAdminPanel } from './AlertasAdminPanel';
import { AlertasStockPanel } from './AlertasStockPanel';

type Pestana = 'admin' | 'stock';

const PESTANAS: { value: Pestana; label: string }[] = [
  { value: 'admin', label: 'Administrativas' },
  { value: 'stock', label: 'Stock bajo' },
];

export function AlertasView() {
  const [pestana, setPestana] = useState<Pestana>('admin');

  return (
    <div>
      <PageHeader
        title="Alertas"
        subtitle="Requerimientos de las sedes y productos por reabastecer"
        actions={<SegmentedControl ariaLabel="Tipo de alerta" options={PESTANAS} value={pestana} onChange={setPestana} />}
      />
      {pestana === 'admin' ? <AlertasAdminPanel /> : <AlertasStockPanel />}
    </div>
  );
}
