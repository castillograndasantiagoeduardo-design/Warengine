import React from 'react';
import {
  PageHeader,
  SectionTabs,
  ASSETS_SECTION_TABS,
} from '@/features/admin-sucursal';

export const metadata = {
  title: 'Activos y Mantenimientos · Administrador de Sucursal | Warengine',
};

export default function AdminSucursalActivosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Activos"
        description="Control patrimonial de bienes fijos, custodias, mantenimiento preventivo y familias de la sede."
      />
      <SectionTabs
        tabs={ASSETS_SECTION_TABS}
        ariaLabel="Navegación de activos de la sucursal"
      />
      <div>{children}</div>
    </div>
  );
}
