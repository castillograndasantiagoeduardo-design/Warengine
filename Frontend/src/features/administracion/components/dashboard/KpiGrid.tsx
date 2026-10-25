'use client';

/**
 * KpiGrid.tsx — Indicadores globales: finanzas del periodo + estado de la organización.
 */

import { formatCOP, formatNumero, formatPorcentaje } from '@/lib/format/moneda';
import type { MetricasGanancias } from '../../types';
import { KpiCard } from './KpiCard';

interface KpiGridProps {
  metricas: MetricasGanancias | null;
  loadingMetricas: boolean;
  errorMetricas: string | null;
  organizacion: {
    sucursalesActivas: number;
    sucursalesTotales: number;
    usuariosActivos: number;
    usuariosTotales: number;
  };
  loadingOrganizacion: boolean;
  alertasStock: number | null;
  loadingAlertas: boolean;
}

export function KpiGrid({
  metricas,
  loadingMetricas,
  errorMetricas,
  organizacion,
  loadingOrganizacion,
  alertasStock,
  loadingAlertas,
}: KpiGridProps) {
  const sinMetricas = errorMetricas ? 'No disponible' : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          destacado
          icon="$"
          label="Ventas del periodo"
          value={sinMetricas ?? formatCOP(metricas?.ingresosTotales)}
          hint={metricas ? `${formatNumero(metricas.totalFacturas)} facturas emitidas` : errorMetricas ?? undefined}
          loading={loadingMetricas}
        />
        <KpiCard
          icon="▲"
          label="Ganancia neta"
          value={sinMetricas ?? formatCOP(metricas?.gananciaNeta)}
          hint={metricas ? `Costo: ${formatCOP(metricas.costoTotal)}` : undefined}
          loading={loadingMetricas}
        />
        <KpiCard
          icon="%"
          label="Margen"
          value={sinMetricas ?? formatPorcentaje(metricas?.margenPorcentaje)}
          hint="Ganancia neta sobre ingresos"
          loading={loadingMetricas}
        />
        <KpiCard
          icon="⊡"
          label="Ticket promedio"
          value={sinMetricas ?? formatCOP(metricas?.ticketPromedio)}
          hint="Valor medio por factura"
          loading={loadingMetricas}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          icon="⌂"
          label="Sucursales operativas"
          value={`${organizacion.sucursalesActivas} / ${organizacion.sucursalesTotales}`}
          hint="Activas sobre registradas"
          loading={loadingOrganizacion}
        />
        <KpiCard
          icon="☺"
          label="Usuarios activos"
          value={`${organizacion.usuariosActivos} / ${organizacion.usuariosTotales}`}
          hint="Cuentas habilitadas en el sistema"
          loading={loadingOrganizacion}
        />
        <KpiCard
          icon="⚠"
          label="Alertas de stock"
          value={alertasStock === null ? '—' : formatNumero(alertasStock)}
          hint="Productos en o bajo el stock mínimo"
          loading={loadingAlertas}
        />
      </div>
    </div>
  );
}
