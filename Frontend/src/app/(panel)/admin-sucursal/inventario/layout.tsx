/**
 * /admin-sucursal/inventario/layout.tsx — Layout compartido para las pestañas de Inventario.
 *
 * Renderiza la barra de pestañas (`SectionTabs`) para alternar entre:
 * - Productos (`/admin-sucursal/inventario`)
 * - Movimientos (`/admin-sucursal/inventario/movimientos`)
 * - Proveedores (`/admin-sucursal/inventario/proveedores`)
 * (Las pestañas Categorías y Transferencias se añadirán en `INVENTORY_SECTION_TABS` en fases posteriores).
 */

import React from 'react';
import {
  SectionTabs,
  INVENTORY_SECTION_TABS,
} from '@/features/admin-sucursal';

export default function AdminSucursalInventarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <SectionTabs
        tabs={INVENTORY_SECTION_TABS}
        ariaLabel="Navegación de inventario de la sucursal"
      />
      {children}
    </div>
  );
}
