import React from 'react';
import { PageHeader, SectionTabs } from '@/features/admin-sucursal/components/shared';
import { INVOICING_SECTION_TABS } from '@/features/admin-sucursal/config';

export const metadata = {
  title: 'Facturación y Alertas · Administrador de Sucursal | Warengine',
};

export default function FacturacionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturación y Alertas"
        description="Supervisión de comprobantes emitidos en tiempo real, anulación con reversión de inventario, devoluciones y resolución de alertas de caja."
      />
      <SectionTabs tabs={INVOICING_SECTION_TABS} />
      <div>{children}</div>
    </div>
  );
}
