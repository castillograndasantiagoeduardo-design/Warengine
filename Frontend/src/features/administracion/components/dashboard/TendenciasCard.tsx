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
  denied?: boolean;
  onRetry: () => void;
  agrupacion: AgrupacionTendencia;
  onAgrupacionChange: (a: AgrupacionTendencia) => void;
}

function normalizarPuntosTendencia(
  puntos: PuntoTendenciaVenta[] | null,
  agrupacion: AgrupacionTendencia,
): PuntoTendenciaVenta[] {
  if (!puntos || puntos.length === 0) return [];
  if (puntos.length >= 7) return puntos;

  const mapa = new Map(puntos.map((p) => [p.periodo, p]));
  const ultimoPunto = puntos[puntos.length - 1];

  if (agrupacion === 'dia') {
    const fechaRef = new Date(
      /^\d{4}-\d{2}-\d{2}/.test(ultimoPunto.periodo)
        ? `${ultimoPunto.periodo.slice(0, 10)}T12:00:00`
        : new Date(),
    );
    const resultado: PuntoTendenciaVenta[] = [];
    const diasTotal = 7;
    for (let i = diasTotal - 1; i >= 0; i--) {
      const d = new Date(fechaRef);
      d.setDate(d.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const existente = mapa.get(iso);
      if (existente) {
        resultado.push(existente);
      } else {
        resultado.push({
          periodo: iso,
          totalVentas: 0,
          totalGanancias: 0,
          cantidadFacturas: 0,
        });
      }
    }
    return resultado;
  }

  if (agrupacion === 'semana') {
    if (puntos.length < 4) {
      const semanaMatch = /^(\d{4})-W(\d{1,2})$/.exec(ultimoPunto.periodo);
      const anio = semanaMatch ? Number(semanaMatch[1]) : 2026;
      const semActual = semanaMatch ? Number(semanaMatch[2]) : 42;
      const resultado: PuntoTendenciaVenta[] = [];
      for (let i = 3; i >= 0; i--) {
        const numSem = Math.max(1, semActual - i);
        const iso = `${anio}-W${String(numSem).padStart(2, '0')}`;
        const existente = mapa.get(iso);
        if (existente) {
          resultado.push(existente);
        } else {
          resultado.push({
            periodo: iso,
            totalVentas: 0,
            totalGanancias: 0,
            cantidadFacturas: 0,
          });
        }
      }
      return resultado;
    }
  }

  if (agrupacion === 'mes') {
    if (puntos.length < 4) {
      const mesMatch = /^(\d{4})-(\d{2})$/.exec(ultimoPunto.periodo);
      const anio = mesMatch ? Number(mesMatch[1]) : 2026;
      const mes = mesMatch ? Number(mesMatch[2]) - 1 : 9;
      const ref = new Date(anio, mes, 1, 12, 0, 0);
      const resultado: PuntoTendenciaVenta[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const existente = mapa.get(iso);
        if (existente) {
          resultado.push(existente);
        } else {
          resultado.push({
            periodo: iso,
            totalVentas: 0,
            totalGanancias: 0,
            cantidadFacturas: 0,
          });
        }
      }
      return resultado;
    }
  }

  return puntos;
}

export function TendenciasCard({ puntos, loading, error, denied, onRetry, agrupacion, onAgrupacionChange }: TendenciasCardProps) {
  const datos = normalizarPuntosTendencia(puntos, agrupacion);
  const labels = datos.map((p) => formatPeriodo(p.periodo));

  return (
    <SectionCard
      title="Tendencia de ventas"
      subtitle="Ventas y ganancia neta por periodo"
      loading={loading}
      error={error}
      denied={denied}
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
        <summary className="inline-flex min-h-[44px] cursor-pointer items-center text-xs uppercase tracking-wider text-white/60 hover:text-white font-[family-name:var(--font-ui)]">
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
