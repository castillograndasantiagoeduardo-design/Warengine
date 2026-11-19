'use client';

/**
 * /admin-sucursal/configuracion — Vista en construcción para configuración de cuenta y sede.
 */

import React from 'react';
import { Settings } from 'lucide-react';
import { ModuleUnderConstruction } from '@/features/admin-sucursal';

export default function AdminSucursalConfiguracionPage() {
  return (
    <ModuleUnderConstruction
      title="Configuración"
      subtitle="Preferencias operativas, seguridad de la cuenta (2FA) y parámetros de la sede"
      icon={<Settings className="w-5 h-5" />}
    />
  );
}
