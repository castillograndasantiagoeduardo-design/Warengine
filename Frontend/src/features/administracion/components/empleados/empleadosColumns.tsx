'use client';

/**
 * empleadosColumns.tsx — Columnas de la tabla de empleados.
 */

import type { DataTableColumn } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { formatCOP } from '@/lib/format/moneda';
import type { Empleado } from '../../types';

interface Acciones {
  onEditar: (e: Empleado) => void;
  onSalarios?: (e: Empleado) => void;
}

const BTN = 'min-h-[44px] rounded-lg px-3 text-xs uppercase tracking-wider font-[family-name:var(--font-pixelify)] cursor-pointer';

export function columnasEmpleados({ onEditar, onSalarios }: Acciones): DataTableColumn<Empleado>[] {
  return [
    {
      key: 'nombre',
      header: 'Empleado',
      sortable: true,
      render: (e) => (
        <div>
          <p className="font-medium text-white">{e.nombre}</p>
          <p className="text-xs text-white/50">
            {e.tipoDocumento} {e.numeroDocumento}
          </p>
        </div>
      ),
    },
    { key: 'cargo', header: 'Cargo', sortable: true, render: (e) => e.cargo || <span className="text-white/35">—</span> },
    {
      key: 'sucursalNombre',
      header: 'Sucursal / Área',
      sortable: true,
      render: (e) => (
        <div>
          <p>{e.sucursalNombre}</p>
          <p className="text-xs text-white/50">{e.areaNombre ?? 'Sin área'}</p>
        </div>
      ),
    },
    {
      key: 'sueldoActual',
      header: 'Sueldo',
      sortable: true,
      align: 'right',
      render: (e) => (e.sueldoActual !== null ? formatCOP(e.sueldoActual) : <span className="text-white/35">—</span>),
    },
    {
      key: 'isActive',
      header: 'Estado',
      sortable: true,
      render: (e) => <Badge tone={e.isActive ? 'success' : 'neutral'}>{e.isActive ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (e) => (
        <div className="flex justify-end gap-1">
          <button type="button" onClick={() => onEditar(e)} className={`${BTN} text-[#e9b949] hover:bg-[#e3b341]/15`}>
            Editar
          </button>
          {onSalarios && (
            <button type="button" onClick={() => onSalarios(e)} className={`${BTN} text-sky-300 hover:bg-sky-500/15`}>
              Salario
            </button>
          )}
        </div>
      ),
    },
  ];
}
