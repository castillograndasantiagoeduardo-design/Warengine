'use client';

/**
 * LineChart.tsx — Gráfico de líneas SVG sin dependencias, con crosshair y tooltip.
 *
 * - Un solo eje Y (todas las series en la misma unidad).
 * - La primera serie puede rellenarse como área (`area: true`).
 * - Navegable con teclado (← →) además del puntero.
 * Paleta validada para superficie #14213d: #b88a1f (dorado) y #5b8def (azul).
 */

import React, { useState } from 'react';
import { useAnchoContenedor } from './useAnchoContenedor';

export interface LineSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
  area?: boolean;
}

interface LineChartProps {
  labels: string[];
  series: LineSeries[];
  formatY: (v: number) => string;
  formatTooltip?: (v: number) => string;
  height?: number;
  ariaLabel: string;
}

const M = { top: 12, right: 16, bottom: 28, left: 64 };

function techoBonito(max: number): number {
  if (max <= 0) return 1;
  const magnitud = 10 ** Math.floor(Math.log10(max));
  const paso = [1, 2, 2.5, 5, 10].find((p) => p * magnitud >= max) ?? 10;
  return paso * magnitud;
}

export function LineChart({ labels, series, formatY, formatTooltip = formatY, height = 260, ariaLabel }: LineChartProps) {
  const { ref, ancho } = useAnchoContenedor<HTMLDivElement>();
  const [activo, setActivo] = useState<number | null>(null);

  const n = labels.length;
  const w = Math.max(ancho - M.left - M.right, 10);
  const h = height - M.top - M.bottom;
  const maxY = techoBonito(Math.max(0, ...series.flatMap((s) => s.values)));
  const x = (i: number) => (n <= 1 ? w / 2 : (i / (n - 1)) * w);
  const y = (v: number) => h - (Math.max(v, 0) / maxY) * h;
  const ticksY = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxY);
  const pasoX = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(w / 80))));

  const indiceDesdePuntero = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width;
    setActivo(Math.min(n - 1, Math.max(0, Math.round(rel * (n - 1)))));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    setActivo((prev) => Math.min(n - 1, Math.max(0, (prev ?? (delta > 0 ? -1 : n)) + delta)));
  };

  const tooltipIzq = activo !== null ? M.left + x(activo) : 0;

  return (
    <div ref={ref} className="relative w-full">
      <svg
        width={ancho}
        height={height}
        role="img"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onBlur={() => setActivo(null)}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-[#e3b341] rounded-lg"
      >
        <g transform={`translate(${M.left},${M.top})`}>
          {ticksY.map((t) => (
            <g key={t}>
              <line x1={0} x2={w} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.08)" />
              <text x={-10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-white/50 text-[11px]">
                {formatY(t)}
              </text>
            </g>
          ))}
          {labels.map((l, i) =>
            i % pasoX === 0 || i === n - 1 ? (
              <text key={`${l}-${i}`} x={x(i)} y={h + 18} textAnchor="middle" className="fill-white/50 text-[11px]">
                {l}
              </text>
            ) : null,
          )}
          {series.map((s) => {
            const puntos = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
            return (
              <g key={s.key}>
                {s.area && n > 1 && <polygon points={`0,${h} ${puntos} ${x(n - 1)},${h}`} fill={s.color} fillOpacity={0.18} />}
                {s.area && n === 1 && (
                  <rect
                    x={0}
                    y={y(s.values[0])}
                    width={w}
                    height={Math.max(h - y(s.values[0]), 0)}
                    fill={s.color}
                    fillOpacity={0.12}
                  />
                )}
                {n > 1 && (
                  <polyline points={puntos} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                )}
                {n === 1 && (
                  <>
                    <line x1={0} x2={w} y1={y(s.values[0])} y2={y(s.values[0])} stroke={s.color} strokeWidth={2} strokeDasharray="4 4" opacity={0.6} />
                    <circle cx={x(0)} cy={y(s.values[0])} r={6} fill={s.color} stroke="#14213d" strokeWidth={2} />
                  </>
                )}
              </g>
            );
          })}
          {activo !== null && (
            <g pointerEvents="none">
              <line x1={x(activo)} x2={x(activo)} y1={0} y2={h} stroke="rgba(255,255,255,0.35)" />
              {series.map((s) => (
                <circle key={s.key} cx={x(activo)} cy={y(s.values[activo])} r={5} fill={s.color} stroke="#14213d" strokeWidth={2} />
              ))}
            </g>
          )}
          <rect
            width={w}
            height={h}
            fill="transparent"
            onPointerMove={indiceDesdePuntero}
            onPointerDown={indiceDesdePuntero}
            onPointerLeave={() => setActivo(null)}
          />
        </g>
      </svg>

      {activo !== null && (
        <div
          role="status"
          className="pointer-events-none absolute top-2 z-10 min-w-[160px] rounded-lg border border-white/15 bg-[#0a1226]/95 px-3 py-2 text-xs shadow-xl"
          style={{ left: Math.min(Math.max(tooltipIzq - 80, 0), Math.max(ancho - 170, 0)) }}
        >
          <p className="mb-1 text-white/60">{labels[activo]}</p>
          {series.map((s) => (
            <p key={s.key} className="flex items-center gap-2">
              <span className="inline-block h-0.5 w-3" style={{ background: s.color }} aria-hidden="true" />
              <strong className="text-white">{formatTooltip(s.values[activo])}</strong>
              <span className="text-white/55">{s.label}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
