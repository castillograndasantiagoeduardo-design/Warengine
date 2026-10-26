'use client';

/**
 * KpiGrid.tsx — Indicadores globales: finanzas del periodo + estado de la organización.
 *
 * Cada fila se muestra solo si la sesión tiene el permiso de su endpoint.
 */

import type { ResumenDashboardResponse } from '@warengine/contracts';
import { formatCOP, formatNumero, formatPorcentaje } from '@/lib/format/moneda';
import type { MetricasGanancias } from '../../types';
import { KpiCard } from './KpiCard';

interface Bloque<T> {
  visible: boolean;
  data: T | null;
  loading: boolean;
  error: string | null;
  denegado: boolean;
}

interface KpiGridProps {
  metricas: Bloque<MetricasGanancias>;
  resumen: Bloque<ResumenDashboardResponse>;
  alertasStock: Bloque<number>;
}

const estadoError = (b: Bloque<unknown>) => (b.denegado ? 'Acceso restringido' : b.error ? 'No disponible' : undefined);

export function KpiGrid({ metricas, resumen, alertasStock }: KpiGridProps) {
  const m = metricas.data;
  const r = resumen.data;
  const errM = estadoError(metricas);
  const errR = estadoError(resumen);

  return (
    <div className="flex flex-col gap-4">
      {metricas.visible && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            destacado
            icon="$"
            label="Ventas del periodo"
            value={errM ?? formatCOP(m?.ingresosTotales)}
            hint={m ? `${formatNumero(m.totalFacturas)} facturas emitidas` : metricas.error ?? undefined}
            loading={metricas.loading}
          />
          <KpiCard icon="▲" label="Ganancia neta" value={errM ?? formatCOP(m?.gananciaNeta)} hint={m ? `Costo: ${formatCOP(m.costoTotal)}` : undefined} loading={metricas.loading} />
          <KpiCard icon="%" label="Margen" value={errM ?? formatPorcentaje(m?.margenPorcentaje)} hint="Ganancia neta sobre ingresos" loading={metricas.loading} />
          <KpiCard icon="⊡" label="Ticket promedio" value={errM ?? formatCOP(m?.ticketPromedio)} hint="Valor medio por factura" loading={metricas.loading} />
        </div>
      )}
      {(resumen.visible || alertasStock.visible) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {resumen.visible && (
            <>
              <KpiCard
                icon="⌂"
                label="Sucursales operativas"
                value={errR ?? `${r?.sucursalesActivas ?? 0} / ${r?.totalSucursales ?? 0}`}
                hint="Activas sobre registradas"
                loading={resumen.loading}
              />
              <KpiCard
                icon="☺"
                label="Usuarios activos"
                value={errR ?? `${r?.usuariosActivos ?? 0} / ${r?.usuariosTotales ?? 0}`}
                hint="Cuentas habilitadas en el sistema"
                loading={resumen.loading}
              />
            </>
          )}
          {alertasStock.visible && (
            <KpiCard
              icon="⚠"
              label="Alertas de stock"
              value={estadoError(alertasStock) ?? formatNumero(alertasStock.data ?? 0)}
              hint="Productos en o bajo el stock mínimo"
              loading={alertasStock.loading}
            />
          )}
        </div>
      )}
    </div>
  );
}
