'use client';

import React, { useState } from 'react';

type GroupingType = 'dia' | 'semana' | 'mes';

export function TrendSalesChart() {
  const [grouping, setGrouping] = useState<GroupingType>('dia');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Datos simulados estructurados según el contrato de /dashboard/tendencias
  const dataMap: Record<GroupingType, { label: string; ventas: number; tickets: number }[]> = {
    dia: [
      { label: 'Lun', ventas: 14200000, tickets: 48 },
      { label: 'Mar', ventas: 16800000, tickets: 56 },
      { label: 'Mié', ventas: 13500000, tickets: 44 },
      { label: 'Jue', ventas: 19400000, tickets: 68 },
      { label: 'Vie', ventas: 24500000, tickets: 89 },
      { label: 'Sáb', ventas: 28900000, tickets: 112 },
      { label: 'Dom', ventas: 11150000, tickets: 35 },
    ],
    semana: [
      { label: 'Sem 1', ventas: 89000000, tickets: 310 },
      { label: 'Sem 2', ventas: 104500000, tickets: 362 },
      { label: 'Sem 3', ventas: 97800000, tickets: 338 },
      { label: 'Sem 4', ventas: 128450000, tickets: 452 },
    ],
    mes: [
      { label: 'May', ventas: 380000000, tickets: 1240 },
      { label: 'Jun', ventas: 412000000, tickets: 1380 },
      { label: 'Jul', ventas: 395000000, tickets: 1310 },
      { label: 'Ago', ventas: 448000000, tickets: 1490 },
      { label: 'Sep', ventas: 472000000, tickets: 1580 },
      { label: 'Oct', ventas: 519750000, tickets: 1720 },
    ],
  };

  const points = dataMap[grouping];
  const maxVentas = Math.max(...points.map((p) => p.ventas)) * 1.15;

  // Dimensiones del SVG
  const width = 600;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;

  const getCoordinates = (index: number, val: number) => {
    const x = paddingX + (index / (points.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - (val / maxVentas) * (height - paddingY * 2);
    return { x, y };
  };

  const polylinePoints = points
    .map((p, i) => {
      const { x, y } = getCoordinates(i, p.ventas);
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${polylinePoints} ${width - paddingX},${height - paddingY} ${paddingX},${height - paddingY}`;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="relative p-5 rounded-2xl bg-[#0f1733]/90 border border-white/10 flex flex-col justify-between backdrop-blur-sm select-none">
      {/* Encabezado del Gráfico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white font-[family-name:var(--font-archivo)] uppercase tracking-wider">
              Tendencia de Ventas (RF-ADM-A2)
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#e3b341]/10 text-[#e3b341] border border-[#e3b341]/20 font-[family-name:var(--font-pixelify)]">
              FACTURACIÓN
            </span>
          </div>
          <p className="text-xs text-white/50 mt-0.5 font-[family-name:var(--font-archivo)]">
            Comportamiento temporal de ingresos brutos y emisión de comprobantes
          </p>
        </div>

        {/* Selector de Agrupación Temporal */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 self-start sm:self-auto">
          {(['dia', 'semana', 'mes'] as GroupingType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setGrouping(tab);
                setHoveredPoint(null);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer font-[family-name:var(--font-pixelify)] ${
                grouping === tab
                  ? 'bg-[#e3b341] text-[#111111] shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {tab === 'dia' ? 'Día' : tab === 'semana' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      {/* Área del Gráfico SVG */}
      <div className="relative w-full h-64 mt-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e3b341" stopOpacity="0.4" />
              <stop offset="80%" stopColor="#e3b341" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#e3b341" stopOpacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Líneas horizontales de guía */}
          {[0, 0.33, 0.66, 1].map((pct, i) => {
            const y = paddingY + pct * (height - paddingY * 2);
            return (
              <line
                key={i}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Relleno degradado bajo la curva */}
          <polygon points={areaPoints} fill="url(#salesGradient)" />

          {/* Línea de la serie de ventas */}
          <polyline
            fill="none"
            stroke="#e3b341"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
            filter="url(#glow)"
          />

          {/* Puntos y nodos interactivos */}
          {points.map((p, i) => {
            const { x, y } = getCoordinates(i, p.ventas);
            const isHovered = hoveredPoint === i;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Etiqueta del Eje X */}
                <text
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.5)"
                  fontSize="10"
                  fontFamily="var(--font-pixelify)"
                >
                  {p.label}
                </text>

                {/* Área invisible para facilitar el hover en táctil/mouse */}
                <circle cx={x} cy={y} r="14" fill="transparent" />

                {/* Punto exterior */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 4}
                  fill="#0d1630"
                  stroke="#e3b341"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />

                {/* Tooltip flotante al hacer hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={x - 60}
                      y={y - 50}
                      width="120"
                      height="38"
                      rx="8"
                      fill="#0b1226"
                      stroke="#e3b341"
                      strokeWidth="1"
                      filter="drop-shadow(0 4px 12px rgba(0,0,0,0.5))"
                    />
                    <text
                      x={x}
                      y={y - 34}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="var(--font-archivo)"
                    >
                      {formatCurrency(p.ventas)}
                    </text>
                    <text
                      x={x}
                      y={y - 20}
                      textAnchor="middle"
                      fill="#e3b341"
                      fontSize="9"
                      fontFamily="var(--font-pixelify)"
                    >
                      {p.tickets} Comprobantes
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Pie de Estadísticas Rápido */}
      <div className="mt-2 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
        <span className="font-[family-name:var(--font-archivo)]">
          Total acumulado en periodo: <strong className="text-white">{formatCurrency(points.reduce((acc, curr) => acc + curr.ventas, 0))}</strong>
        </span>
        <span className="font-[family-name:var(--font-pixelify)] text-[#e3b341]">
          {points.reduce((acc, curr) => acc + curr.tickets, 0)} FACTURAS EMITIDAS
        </span>
      </div>
    </div>
  );
}
