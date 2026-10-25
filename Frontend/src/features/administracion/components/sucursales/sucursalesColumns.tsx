'use client';

/**
 * sucursalesColumns.tsx — Definición de columnas de la tabla de sucursales.
 */

import Link from 'next/link';
import type { DataTableColumn } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { SEDE_PRINCIPAL_ID, type Sucursal } from '../../types';

interface Acciones {
  onEditar: (s: Sucursal) => void;
  onCambiarEstado: (s: Sucursal) => void;
}

const BTN_ACCION =
  'min-h-[44px] rounded-lg px-3 text-xs uppercase tracking-wider font-[family-name:var(--font-pixelify)] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed';

export function columnasSucursales({ onEditar, onCambiarEstado }: Acciones): DataTableColumn<Sucursal>[] {
  return [
    {
      key: 'nombre',
      header: 'Nombre',
      sortable: true,
      render: (s) => (
        <Link href={`/dashboard/sucursales/${s.id}`} className="inline-flex min-h-[44px] items-center gap-2 font-medium text-white hover:text-[#e9b949]">
          {s.nombre}
          {s.id === SEDE_PRINCIPAL_ID && <Badge tone="gold">Principal</Badge>}
        </Link>
      ),
    },
    { key: 'direccion', header: 'Dirección', sortable: true, render: (s) => s.direccion || <span className="text-white/35">—</span> },
    { key: 'contacto', header: 'Contacto', render: (s) => s.contacto || <span className="text-white/35">—</span> },
    {
      key: 'isActive',
      header: 'Estado',
      sortable: true,
      render: (s) => <Badge tone={s.isActive ? 'success' : 'neutral'}>{s.isActive ? 'Activa' : 'Inactiva'}</Badge>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (s) => {
        const esPrincipal = s.id === SEDE_PRINCIPAL_ID;
        return (
          <div className="flex justify-end gap-1">
            <Link href={`/dashboard/sucursales/${s.id}`} className={`${BTN_ACCION} inline-flex items-center text-white/70 hover:bg-white/10 hover:text-white`}>
              Ver
            </Link>
            <button type="button" onClick={() => onEditar(s)} className={`${BTN_ACCION} text-[#e9b949] hover:bg-[#e3b341]/15`}>
              Editar
            </button>
            <button
              type="button"
              onClick={() => onCambiarEstado(s)}
              disabled={esPrincipal && s.isActive}
              title={esPrincipal && s.isActive ? 'La Sede Principal no puede inactivarse' : undefined}
              className={`${BTN_ACCION} ${s.isActive ? 'text-red-300 hover:bg-red-500/15' : 'text-emerald-300 hover:bg-emerald-500/15'}`}
            >
              {s.isActive ? 'Inactivar' : 'Activar'}
            </button>
          </div>
        );
      },
    },
  ];
}
