/**
 * /admin-sucursal/inventario/layout.tsx — Layout compartido para las pestañas de Inventario.
 *
 * Renderiza el PageHeader del módulo y SectionTabs para alternar entre:
 * - Productos (/admin-sucursal/inventario)
 * - Movimientos (/admin-sucursal/inventario/movimientos)
 * - Proveedores (/admin-sucursal/inventario/proveedores)
 * - Categorías (/admin-sucursal/inventario/categorias)
 */

import React from 'react';
import {
  PageHeader,
  SectionTabs,
  INVENTORY_SECTION_TABS,
} from '@/features/admin-sucursal';

export const metadata = {
  title: 'Inventario · Administrador de Sucursal | WarEngine',
};

export default function AdminSucursalInventarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        description="Productos, movimientos, proveedores y categorías de la sede, con el stock en tiempo real."
      />
      <SectionTabs
        tabs={INVENTORY_SECTION_TABS}
        ariaLabel="Navegación de inventario de la sucursal"
      />
      <div>{children}</div>
    </div>
  );
}
