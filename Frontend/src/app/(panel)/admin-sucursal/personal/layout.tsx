import React from 'react';
import {
  PageHeader,
  SectionTabs,
  STAFF_SECTION_TABS,
} from '@/features/admin-sucursal';

export const metadata = {
  title: 'Personal y Turnos · Administrador de Sucursal | Warengine',
};

export default function AdminSucursalPersonalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal"
        description="Gestión de colaboradores de la sede, supervisión de turnos de caja y arqueos."
      />
      <SectionTabs
        tabs={STAFF_SECTION_TABS}
        ariaLabel="Navegación de personal y turnos de la sucursal"
      />
      <div>{children}</div>
    </div>
  );
}
