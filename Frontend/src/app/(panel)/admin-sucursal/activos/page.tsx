'use client';

/**
 * /admin-sucursal/activos — Vista en construcción para gestión de activos fijos.
 */

import React from 'react';
import { Wrench } from 'lucide-react';
import { ModuleUnderConstruction } from '@/features/admin-sucursal';

export default function AdminSucursalActivosPage() {
  return (
    <ModuleUnderConstruction
      title="Activos"
      subtitle="Control de activos fijos, asignaciones y mantenimientos de la sede"
      icon={<Wrench className="w-5 h-5" />}
    />
  );
}
