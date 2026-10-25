'use client';

/**
 * ActiveCashiersCard.tsx — Tarjeta de supervisión de cajeros y turnos de caja en vivo.
 *
 * Principio SOLID: Single Responsibility Principle (SRP).
 * Presenta el estado de los turnos de venta abiertos en la sucursal activa,
 * cajeros asignados, horas de apertura y totales facturados acumulados.
 */

import React from 'react';
import { GlassCard } from './GlassCard';
import { StatusBadge } from './StatusBadge';
import { ArrowRightIcon } from './Icons';
import type { CashierShiftItem } from '../types/branch-dashboard.types';

interface ActiveCashiersCardProps {
  turnos?: CashierShiftItem[];
  onAdministrarTurnosClick?: () => void;
  className?: string;
}

const DEFAULT_TURNOS: CashierShiftItem[] = [
  {
    id: '1',
    cajeroNombre: 'Laura Gómez',
    cajeroIniciales: 'LG',
    cajaNumero: 'Caja 01',
    horaInicio: '08:00',
    totalVentas: 1620000,
    totalVentasFormateado: '$1.620.000',
    cantidadVentas: 32,
    estado: 'abierto',
  },
  {
    id: '2',
    cajeroNombre: 'Carlos Ruiz',
    cajeroIniciales: 'CR',
    cajaNumero: 'Caja 02',
    horaInicio: '08:00',
    totalVentas: 1980000,
    totalVentasFormateado: '$1.980.000',
    cantidadVentas: 40,
    estado: 'abierto',
  },
  {
    id: '3',
    cajeroNombre: 'Ana Torres',
    cajeroIniciales: 'AT',
    cajaNumero: 'Caja 03',
    horaInicio: '08:00',
    totalVentas: 1250000,
    totalVentasFormateado: '$1.250.000',
    cantidadVentas: 25,
    estado: 'abierto',
  },
];

export function ActiveCashiersCard({
  turnos = DEFAULT_TURNOS,
  onAdministrarTurnosClick,
  className = '',
}: ActiveCashiersCardProps) {
  const lista = turnos && turnos.length > 0 ? turnos : DEFAULT_TURNOS;
  const turnosAbiertosCount = lista.filter((t) => t.estado === 'abierto').length;

  return (
    <GlassCard padding="lg" className={`flex flex-col justify-between ${className}`}>
      {/* 1. Encabezado con Indicador de Turnos Abiertos */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-base font-semibold text-white font-[family-name:var(--font-archivo)]">
            Turnos en curso
          </h3>
          <StatusBadge
            variant="success"
            label={`${turnosAbiertosCount} abiertas`}
            pulseDot
            size="sm"
          />
        </div>

        {/* 2. Lista de Cajeros en Servicio */}
        <div className="space-y-2 mt-2">
          {lista.map((turno) => (
            <div
              key={turno.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar circular del Cajero */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#1b2b54] to-[#2a3f78] border border-white/[0.08] text-[#e3b341] font-bold text-xs font-[family-name:var(--font-pixelify)]">
                  {turno.cajeroIniciales}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate font-[family-name:var(--font-archivo)]">
                    {turno.cajeroNombre}
                  </p>
                  <p className="text-[10px] text-slate-400 font-[family-name:var(--font-archivo)]">
                    {turno.cajaNumero} &bull; Desde {turno.horaInicio}
                  </p>
                </div>
              </div>

              {/* Ventas y Conteo */}
              <div className="text-right shrink-0">
                <span className="block text-xs font-mono font-bold text-white tabular-nums">
                  {turno.totalVentasFormateado}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {turno.cantidadVentas} ventas
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Acción Footer */}
      <button
        onClick={onAdministrarTurnosClick}
        className="
          mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between w-full
          text-xs font-semibold text-[#e3b341] hover:text-[#f3d37a] transition-colors
          group cursor-pointer font-[family-name:var(--font-pixelify)] uppercase tracking-wider
        "
      >
        <span>Administrar cajas y turnos</span>
        <span className="transform transition-transform duration-150 group-hover:translate-x-1">
          <ArrowRightIcon size={14} />
        </span>
      </button>
    </GlassCard>
  );
}
