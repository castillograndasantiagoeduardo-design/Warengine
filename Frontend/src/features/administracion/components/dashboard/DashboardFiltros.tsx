'use client';

/**
 * DashboardFiltros.tsx — Fila única de filtros del dashboard: rango de fechas y sucursal.
 */

import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { RANGOS, type RangoPreset } from '../../hooks/useDashboardGlobal';
import type { Sucursal } from '../../types';

interface DashboardFiltrosProps {
  rango: RangoPreset;
  onRangoChange: (r: RangoPreset) => void;
  sucursalId: number | undefined;
  onSucursalChange: (id: number | undefined) => void;
  sucursales: Sucursal[];
  /** El filtro necesita listar sedes (administracion:gestionar-sucursales). */
  mostrarSucursal: boolean;
}

export function DashboardFiltros({ rango, onRangoChange, sucursalId, onSucursalChange, sucursales, mostrarSucursal }: DashboardFiltrosProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <SegmentedControl ariaLabel="Rango de fechas" options={RANGOS} value={rango} onChange={onRangoChange} />
      {mostrarSucursal && (
        <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/60 font-[family-name:var(--font-ui)]">
          Sucursal
          <select
            className="panel-input w-auto min-w-[200px] cursor-pointer normal-case tracking-normal"
            value={sucursalId ?? ''}
            onChange={(e) => onSucursalChange(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Todas (consolidado)</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
                {s.isActive ? '' : ' (inactiva)'}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
