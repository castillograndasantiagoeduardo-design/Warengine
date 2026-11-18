'use client';

/**
 * /admin-sucursal/reportes — Vista en construcción para analítica y reportes de sucursal.
 */

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { ModuleUnderConstruction } from '@/features/admin-sucursal';

export default function AdminSucursalReportesPage() {
  return (
    <ModuleUnderConstruction
      title="Reportes"
      subtitle="Analítica financiera, ranking de productos y exportación de indicadores"
      icon={<BarChart3 className="w-5 h-5" />}
    />
  );
}
