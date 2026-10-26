'use client';

/**
 * SalesVelocityChart.tsx — Gráfico horario de rendimiento de ventas y meta diaria.
 *
 * Principio SOLID: Single Responsibility Principle (SRP).
 * Encapsula la visualización de la curva de ventas horaria con curvas Bezier puras en SVG,
 * comparativa con la jornada anterior y barra de progreso de la meta diaria de la sucursal.
 */

import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { TargetIcon } from './Icons';
import type { SalesVelocityData, SalesVelocityPoint } from '../types/branch-dashboard.types';

interface SalesVelocityChartProps {
  data?: SalesVelocityData;
  className?: string;
}

const DEFAULT_INTERVALOS: SalesVelocityPoint[] = [
  { hora: '08:00', ventasHoy: 0, ventasAyer: 0 },
  { hora: '10:00', ventasHoy: 0, ventasAyer: 0 },
  { hora: '12:00', ventasHoy: 0, ventasAyer: 0 },
  { hora: '14:00', ventasHoy: 0, ventasAyer: 0 },
  { hora: '16:00', ventasHoy: 0, ventasAyer: 0 },
  { hora: '18:00', ventasHoy: 0, ventasAyer: 0 },
  { hora: '20:00', ventasHoy: 0, ventasAyer: 0 },
];

export function SalesVelocityChart({ data, className = '' }: SalesVelocityChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<SalesVelocityPoint | null>(null);

  const puntos = data?.puntos && data.puntos.length > 0 ? data.puntos : DEFAULT_INTERVALOS;
  const meta = data?.metaDiaria ?? {
    objetivo: 5000000,
    actual: 0,
    porcentajeAvance: 0,
  };

  // Dimensiones del canvas SVG
  const width = 640;
  const height = 220;
  const paddingLeft = 58;
  const paddingRight = 24;
  const paddingY = 20;

  const maxSales = Math.max(...puntos.map((p) => Math.max(p.ventasHoy, p.ventasAyer)), 0);
  const maxVal = maxSales > 0 ? maxSales * 1.15 : 1000000;

  const getY = (val: number) => {
    const usableHeight = height - paddingY * 2;
    return height - paddingY - (val / maxVal) * usableHeight;
  };

  const divisor = Math.max(puntos.length - 1, 1);
  const getX = (idx: number) => {
    if (puntos.length <= 1) return width / 2;
    const usableWidth = width - paddingLeft - paddingRight;
    return paddingLeft + (idx / divisor) * usableWidth;
  };

  // Generación de trayectoria Bezier suave para 'Hoy'
  const buildSmoothPath = (points: Array<{ x: number; y: number }>) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const ptsHoy = puntos.map((p, idx) => ({ x: getX(idx), y: getY(p.ventasHoy) }));
  const ptsAyer = puntos.map((p, idx) => ({ x: getX(idx), y: getY(p.ventasAyer) }));

  const linePathHoy = buildSmoothPath(ptsHoy);
  const linePathAyer = buildSmoothPath(ptsAyer);
  const areaPathHoy =
    puntos.length > 1
      ? `${linePathHoy} L ${getX(puntos.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`
      : '';

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);

  const formatCOPCompacto = (val: number) => {
    if (val === 0) return '0';
    if (val >= 1000000) {
      const m = val / 1000000;
      return `$ ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `$ ${(val / 1000).toFixed(0)}k`;
    }
    return `$ ${val}`;
  };

  return (
    <GlassCard padding="lg" className={`flex flex-col justify-between ${className}`}>
      {/* 1. Encabezado del Gráfico con Leyendas */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-white font-[family-name:var(--font-archivo)]">
            Rendimiento de ventas
          </h3>
          <p className="text-xs text-slate-400 font-[family-name:var(--font-archivo)]">
            Ventas por hora &bull; Valores en COP
          </p>
        </div>

        {/* Leyenda comparativa */}
        <div className="flex items-center gap-4 text-xs font-[family-name:var(--font-archivo)]">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-sm bg-[#e3b341] shadow-[0_0_6px_rgba(227,179,65,0.6)]" />
            <span className="text-slate-300 font-medium">Hoy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-sm border-b border-dashed border-[#657796]" />
            <span className="text-slate-500">Ayer</span>
          </div>
        </div>
      </div>

      {/* 2. Área del Gráfico SVG Responsivo */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height + 25}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            {/* Degradado lineal para el área de ventas */}
            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e3b341" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#e3b341" stopOpacity="0.0" />
            </linearGradient>

            {/* Filtro de resplandor neón dorado */}
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Líneas de Escala Horizontal */}
          {[0, 0.33, 0.66, 1].map((pct, i) => {
            const y = height - paddingY - pct * (height - paddingY * 2);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 3}
                  textAnchor="end"
                  fill="#657796"
                  className="text-[9px] font-mono select-none"
                >
                  {formatCOPCompacto(pct * maxVal)}
                </text>
              </g>
            );
          })}

          {/* Área con Degradado 'Hoy' */}
          {areaPathHoy && <path d={areaPathHoy} fill="url(#goldGradient)" />}

          {/* Línea comparativa 'Ayer' (Punteada gris) */}
          {linePathAyer && (
            <path
              d={linePathAyer}
              fill="none"
              stroke="#657796"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.8"
            />
          )}

          {/* Línea principal 'Hoy' (Dorado luminiscente) */}
          {linePathHoy && (
            <path
              d={linePathHoy}
              fill="none"
              stroke="#e3b341"
              strokeWidth="2.5"
              filter="url(#goldGlow)"
            />
          )}

          {/* Nodos de datos interactivos */}
          {ptsHoy.map((pt, idx) => {
            const p = puntos[idx];
            const isHovered = hoveredPoint?.hora === p.hora;
            return (
              <g key={idx} className="cursor-pointer">
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#e3b341"
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2 : 1}
                  className="transition-all duration-150"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {/* Etiquetas de Horas en el Eje X */}
                <text
                  x={pt.x}
                  y={height + 15}
                  textAnchor="middle"
                  fill={isHovered ? '#ffffff' : '#657796'}
                  className="text-[9px] font-mono select-none transition-colors"
                >
                  {p.hora}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip Dinámico Flotante */}
        {hoveredPoint && (
          <div className="absolute top-2 right-4 bg-[#09132b]/95 border border-white/20 p-2.5 rounded-xl shadow-xl backdrop-blur-md pointer-events-none text-xs font-mono">
            <span className="text-slate-400 block text-[10px] uppercase font-sans">
              Hora: {hoveredPoint.hora}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[#e3b341] font-bold">
                Hoy: {formatCOP(hoveredPoint.ventasHoy)}
              </span>
            </div>
            <div className="text-slate-400 text-[11px]">
              Ayer: {formatCOP(hoveredPoint.ventasAyer)}
            </div>
          </div>
        )}
      </div>

      {/* 3. Barra de Meta Diaria de la Sucursal */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e3b341]/10 text-[#e3b341]">
          <TargetIcon size={14} />
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
          <span className="text-slate-400">Meta diaria:</span>
          <span className="font-mono font-semibold text-white">
            {formatCOP(meta.objetivo)}
          </span>
        </div>

        {/* Barra de progreso de la meta */}
        <div className="flex-1 h-1.5 mx-2 bg-white/[0.04] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#b88a1f] to-[#e3b341] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(227,179,65,0.4)]"
            style={{ width: `${Math.min(100, meta.porcentajeAvance)}%` }}
          />
        </div>

        <span className="text-xs font-bold font-mono text-[#e3b341]">
          {meta.porcentajeAvance}%
        </span>
      </div>
    </GlassCard>
  );
}
