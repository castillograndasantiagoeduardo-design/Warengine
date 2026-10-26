'use client';

/**
 * AlertasAdminPanel.tsx — Requerimientos operativos reportados a la dirección (RF-ADM-C15).
 */

import { Forbidden } from '@/components/panel/Forbidden';
import { Button3D } from '@/components/ui/Button3D';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { FILTROS_ESTADO_ALERTA, useAlertasAdmin } from '../../hooks/useAlertas';
import { AlertaCard } from './AlertaCard';

export function AlertasAdminPanel() {
  const a = useAlertasAdmin();

  return (
    <section aria-label="Alertas administrativas">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl ariaLabel="Filtrar por estado" options={FILTROS_ESTADO_ALERTA} value={a.filtros.estado} onChange={(v) => a.setFiltro('estado', v)} />
        {a.sucursales.length > 0 && (
          <select
            aria-label="Filtrar por sucursal"
            className="panel-input sm:w-56 cursor-pointer"
            value={a.filtros.sucursalId ?? ''}
            onChange={(e) => a.setFiltro('sucursalId', e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Todas las sucursales</option>
            {a.sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      {a.loading && <Skeleton className="h-28 w-full" lines={3} />}
      {!a.loading && a.denegado && <Forbidden />}
      {!a.loading && !a.denegado && a.error && (
        <div className="panel-card">
          <EmptyState icon="⚠" title="No se pudieron cargar las alertas" description={a.error} action={<Button3D size="panel" variant="navy" type="button" onClick={a.recargar}>Reintentar</Button3D>} />
        </div>
      )}
      {!a.loading && !a.error && a.rows.length === 0 && (
        <div className="panel-card">
          <EmptyState icon="✔" title="Sin alertas" description="No hay alertas con este estado." />
        </div>
      )}
      {!a.loading && !a.error && a.rows.length > 0 && (
        <div className="flex flex-col gap-3">
          {a.rows.map((alerta) => (
            <AlertaCard key={alerta.id} alerta={alerta} procesando={a.procesando === alerta.id} onCambiar={(estado) => a.cambiarEstado(alerta, estado)} />
          ))}
          {a.totalPages > 1 && (
            <div className="panel-card">
              <Pagination page={a.page} totalPages={a.totalPages} total={a.total} onPageChange={a.setPage} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
