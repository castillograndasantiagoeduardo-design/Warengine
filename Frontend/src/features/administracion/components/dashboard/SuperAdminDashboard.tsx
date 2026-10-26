'use client';

/**
 * SuperAdminDashboard.tsx — Vista global del Super Admin en /dashboard.
 *
 * Solo compone bloques; los datos, filtros y permisos viven en useDashboardGlobal.
 */

import { PageHeader } from '@/components/panel/PageHeader';
import { Button3D } from '@/components/ui/Button3D';
import { useDashboardGlobal } from '../../hooks/useDashboardGlobal';
import { DashboardFiltros } from './DashboardFiltros';
import { KpiGrid } from './KpiGrid';
import { TendenciasCard } from './TendenciasCard';
import { RendimientoCard } from './RendimientoCard';
import { RankingCard } from './RankingCard';

export function SuperAdminDashboard() {
  const d = useDashboardGlobal();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard global"
        subtitle="Administración, ventas & logística de todas las sedes"
        actions={
          d.puede.sucursales && (
            <Button3D size="panel" href="/dashboard/sucursales">
              Gestionar sucursales
            </Button3D>
          )
        }
      />

      <DashboardFiltros
        rango={d.rango}
        onRangoChange={d.setRango}
        sucursalId={d.sucursalId}
        onSucursalChange={d.setSucursalId}
        sucursales={d.sucursales.data ?? []}
        mostrarSucursal={d.puede.sucursales}
      />

      <KpiGrid
        metricas={{ visible: d.puede.metricas, ...d.metricas }}
        resumen={{ visible: d.puede.metricas, ...d.resumen }}
        alertasStock={{ visible: d.puede.alertas, ...d.alertasStock }}
      />

      {d.puede.tendencias && (
        <TendenciasCard
          puntos={d.tendencias.data}
          loading={d.tendencias.loading}
          error={d.tendencias.error}
          denied={d.tendencias.denegado}
          onRetry={d.tendencias.recargar}
          agrupacion={d.agrupacion}
          onAgrupacionChange={d.setAgrupacion}
        />
      )}

      {d.puede.metricas && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RendimientoCard
            datos={d.rendimiento.data}
            loading={d.rendimiento.loading}
            error={d.rendimiento.error}
            denied={d.rendimiento.denegado}
            onRetry={d.rendimiento.recargar}
            enlazarDetalle={d.puede.sucursales}
          />
          <RankingCard
            items={d.ranking.data}
            loading={d.ranking.loading}
            error={d.ranking.error}
            denied={d.ranking.denegado}
            onRetry={d.ranking.recargar}
            orden={d.ordenRanking}
            onOrdenChange={d.setOrdenRanking}
          />
        </div>
      )}
    </div>
  );
}
