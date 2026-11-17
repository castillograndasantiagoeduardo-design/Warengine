'use client';

/**
 * MetodosPago.tsx — Distribución de métodos de pago del día con Donut SVG nativo.
 *
 * Incluye:
 * 1. Cabecera con Título, Subtítulo y Badge de Operaciones Totales.
 * 2. Gráfico Donut SVG centrado (w-32 h-32, radio 52) con porcentaje central y método predominante.
 * 3. Lista inferior de 4 filas: punto de color, método, monto y porcentaje.
 */

import React, { useMemo } from 'react';
import { Tarjeta } from './Tarjeta';
import { Insignia } from './Insignia';
import { formatCOP } from '@/lib/format/moneda';

export interface MetodoPagoItem {
  id: string;
  nombre: string;
  monto: number;
  operaciones: number;
  colorVar: string;
}

export interface MetodosPagoProps {
  metodos?: MetodoPagoItem[];
  totalOperaciones?: number;
  className?: string;
}

export function MetodosPago({
  metodos: metodosProp,
  totalOperaciones = 142,
  className = '',
}: MetodosPagoProps) {
  // Datos reales o de respaldo si no hay operaciones registradas aún
  const items: MetodoPagoItem[] = useMemo(() => {
    if (metodosProp && metodosProp.length > 0) {
      return metodosProp;
    }
    // TODO: datos de respaldo de la especificación si no hay pagos registrados en BD
    return [
      {
        id: 'transferencia',
        nombre: 'Transferencia Bancaria',
        monto: 3380000,
        operaciones: 57,
        colorVar: 'var(--p-500, #3b6cf2)',
      },
      {
        id: 'efectivo',
        nombre: 'Efectivo Mostrador',
        monto: 2535000,
        operaciones: 43,
        colorVar: 'var(--p-luz-2, #4f46e5)',
      },
      {
        id: 'tarjeta',
        nombre: 'Tarjeta Débito / Crédito',
        monto: 1690000,
        operaciones: 28,
        colorVar: 'var(--p-luz-3, #06b6d4)',
      },
      {
        id: 'credito',
        nombre: 'Crédito Corporativo',
        monto: 845000,
        operaciones: 14,
        colorVar: 'var(--p-300, #93b4fd)',
      },
    ];
  }, [metodosProp]);

  const totalMonto = useMemo(() => {
    const sum = items.reduce((acc, m) => acc + m.monto, 0);
    return sum > 0 ? sum : 1;
  }, [items]);

  // Cálculo de segmentos Donut
  const radius = 52;
  const circumference = 2 * Math.PI * radius; // ~326.72

  let accumulatedPercent = 0;
  const segments = items.map((item) => {
    const percent = item.monto / totalMonto;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -(accumulatedPercent * circumference);
    accumulatedPercent += percent;
    return {
      ...item,
      percent: Math.round(percent * 100),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const predominant = segments[0] || { percent: 40, nombre: 'Transferencia' };
  const opsTotal = totalOperaciones || items.reduce((acc, i) => acc + i.operaciones, 0);

  return (
    <Tarjeta
      titulo="Métodos de pago"
      subtitulo="Distribución de transacciones del día"
      className={`h-full ${className}`}
      accion={
        <span className="text-xs font-sans font-medium text-text-muted px-2.5 py-1 rounded-lg superficie-control tabular-nums whitespace-nowrap">
          {opsTotal} op.
        </span>
      }
    >
      <div className="flex flex-col justify-between h-full space-y-4 font-sans">
        {/* 2. Donut SVG Centrado */}
      <div className="py-2 flex items-center justify-center relative">
        <div className="w-32 h-32 relative flex items-center justify-center">
          <svg
            className="w-full h-full transform -rotate-90 block"
            viewBox="0 0 128 128"
          >
            {/* Círculo base de pista */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="var(--border)"
              strokeWidth="11"
            />
            {/* Trazos segmentados */}
            {segments.map((seg) => (
              <circle
                key={seg.id}
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                stroke={seg.colorVar}
                strokeWidth="11"
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            ))}
          </svg>

          {/* Texto central en el hueco del Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
            <span className="text-xl font-titulos font-semibold text-text tabular-nums leading-none">
              {predominant.percent} %
            </span>
            <span className="text-[10px] font-sans font-medium text-text-muted mt-0.5 truncate max-w-[80px]">
              {predominant.nombre.split(' ')[0]}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Lista Inferior de 4 Filas Compactas */}
      <div className="space-y-2 pt-2 border-t border-border/70 text-xs">
        {segments.map((seg) => (
          <div
            key={seg.id}
            className="flex items-center justify-between gap-2 py-0.5"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-border"
                style={{ backgroundColor: seg.colorVar }}
              />
              <span className="font-sans font-medium text-text text-[11px] truncate">
                {seg.nombre}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-sans font-semibold text-text tabular-nums text-[11px]">
                {formatCOP(seg.monto)}
              </span>
              <span className="font-sans text-[11px] text-text-muted tabular-nums w-8 text-right">
                {seg.percent} %
              </span>
            </div>
          </div>
        ))}
      </div>
      </div>
    </Tarjeta>
  );
}

