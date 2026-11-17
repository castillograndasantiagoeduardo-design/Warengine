'use client';

/**
 * /admin-sucursal/clientes — Vista en construcción para el directorio de clientes.
 */

import React from 'react';
import { Users2 } from 'lucide-react';
import { ModuleUnderConstruction } from '@/features/admin-sucursal';

export default function AdminSucursalClientesPage() {
  return (
    <ModuleUnderConstruction
      title="Clientes"
      subtitle="Directorio de clientes B2C y corporativos B2B"
      icon={<Users2 className="w-5 h-5" />}
    />
  );
}
