'use client';

/**
 * TendenciasCard.tsx — Tendencia de ventas y ganancias (RF-ADM-A2), agrupable por día/semana/mes.
 */

import { LineChart } from '@/components/charts/LineChart';
import { SectionCard } from '@/components/ui/SectionCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { formatCOP, formatCOPCompacto, formatNumero } from '@/lib/format/moneda';
import { formatPeriodo } from '@/lib/format/fecha';
import type { AgrupacionTendencia, PuntoTendenciaVenta } from '../../types';

const AGRUPACIONES: { value: AgrupacionTendencia; label: string }[] = [
  { value: 'dia', label: 'Día' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
];

// Paleta validada (dataviz validate_palette, modo oscuro, superficie #14213d)
const COLOR_VENTAS = '#b88a1f';
const COLOR_GANANCIAS = '#5b8def';

interface TendenciasCardProps {
  puntos: PuntoTendenciaVenta[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  agrupacion: AgrupacionTendencia;
  onAgrupacionChange: (a: AgrupacionTendencia) => void;
}

export function TendenciasCard({ puntos, loading, error, onRetry, agrupacion, onAgrupacionChange }: TendenciasCardProps) {
  const datos = puntos ?? [];
  const labels = datos.map((p) => formatPeriodo(p.periodo));

  return (
    <SectionCard
      title="Tendencia de ventas"
      subtitle="Ventas y ganancia neta por periodo"
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={datos.length === 0}
      emptyTitle="Sin ventas en el periodo"
      emptyDescription="Cuando se registren facturas en el POS aparecerán aquí."
      actions={<SegmentedControl ariaLabel="Agrupación" options={AGRUPACIONES} value={agrupacion} onChange={onAgrupacionChange} />}
    >
      <div className="mb-3 flex gap-4 text-xs text-white/70" aria-hidden="true">
        <span className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-4" style={{ background: COLOR_VENTAS }} /> Ventas
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-4" style={{ background: COLOR_GANANCIAS }} /> Ganancia neta
        </span>
      </div>
      <LineChart
        ariaLabel="Gráfico de tendencia de ventas y ganancias. Usa las flechas para recorrer los periodos."
        labels={labels}
        formatY={formatCOPCompacto}
        formatTooltip={formatCOP}
        series={[
          { key: 'ventas', label: 'Ventas', color: COLOR_VENTAS, area: true, values: datos.map((p) => Number(p.totalVentas) || 0) },
          { key: 'ganancias', label: 'Ganancia neta', color: COLOR_GANANCIAS, values: datos.map((p) => Number(p.totalGanancias) || 0) },
        ]}
      />
      <details className="mt-3 text-sm">
        <summary className="inline-flex min-h-[44px] cursor-pointer items-center text-xs uppercase tracking-wider text-white/60 hover:text-white font-[family-name:var(--font-pixelify)]">
          Ver tabla de datos
        </summary>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-white/50">
              <tr>
                <th className="py-1 text-left font-normal">Periodo</th>
                <th className="py-1 text-right font-normal">Ventas</th>
                <th className="py-1 text-right font-normal">Ganancia</th>
                <th className="py-1 text-right font-normal">Facturas</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((p, i) => (
                <tr key={p.periodo} className="border-t border-white/5">
                  <td className="py-1">{labels[i]}</td>
                  <td className="py-1 text-right">{formatCOP(p.totalVentas)}</td>
                  <td className="py-1 text-right">{formatCOP(p.totalGanancias)}</td>
                  <td className="py-1 text-right">{formatNumero(p.cantidadFacturas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </SectionCard>
  );
}
