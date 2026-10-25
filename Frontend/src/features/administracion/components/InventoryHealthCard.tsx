'use client';

/**
 * InventoryHealthCard.tsx — Panel de salud y disponibilidad del inventario de la sucursal.
 *
 * Principio SOLID: Single Responsibility Principle (SRP).
 * Visualiza la disponibilidad porcentual de stock, barra segmentada de salud
 * y lista de productos con alerta crítica que requieren reposición inmediata.
 */

import React from 'react';
import { GlassCard } from './GlassCard';
import { BoxesIcon, TriangleAlertIcon, PackageXIcon, ArrowRightIcon } from './Icons';
import type { InventoryHealthData } from '../types/branch-dashboard.types';

interface InventoryHealthCardProps {
  data?: InventoryHealthData;
  onGestionarReposicionClick?: () => void;
  className?: string;
}

const DEFAULT_SALUD: InventoryHealthData = {
  porcentajeSaludable: 97.1,
  productosSaludables: 1212,
  totalProductos: 1248,
  stockBajoCount: 24,
  sinExistenciasCount: 12,
  alertasPrioritarias: [
    {
      id: '1',
      sku: 'DCT-045',
      nombre: 'Disco de corte 4½”',
      stockActual: 0,
      stockMinimo: 20,
      unidadMedida: 'uds.',
      estado: 'critico',
    },
    {
      id: '2',
      sku: 'CEM-050',
      nombre: 'Cemento gris 50 kg',
      stockActual: 8,
      stockMinimo: 30,
      unidadMedida: 'uds.',
      estado: 'bajo',
    },
    {
      id: '3',
      sku: 'GNT-012',
      nombre: 'Guantes de nitrilo',
      stockActual: 5,
      stockMinimo: 25,
      unidadMedida: 'uds.',
      estado: 'bajo',
    },
  ],
};

export function InventoryHealthCard({
  data = DEFAULT_SALUD,
  onGestionarReposicionClick,
  className = '',
}: InventoryHealthCardProps) {
  const salud = data || DEFAULT_SALUD;
  const totalAlertas = salud.stockBajoCount + salud.sinExistenciasCount;

  // Cálculo de proporciones para la barra segmentada
  const pctOptimo = (salud.productosSaludables / salud.totalProductos) * 100;
  const pctBajo = (salud.stockBajoCount / salud.totalProductos) * 100;
  const pctAgotado = (salud.sinExistenciasCount / salud.totalProductos) * 100;

  return (
    <GlassCard padding="lg" className={`flex flex-col justify-between ${className}`}>
      {/* 1. Encabezado */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-base font-semibold text-white font-[family-name:var(--font-archivo)]">
            Salud del inventario
          </h3>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#e3b341]">
            <BoxesIcon size={16} />
          </div>
        </div>

        {/* 2. Métrica principal de disponibilidad */}
        <div className="mb-3">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-white">
              {salud.porcentajeSaludable}%
            </span>
            <span className="text-xs text-slate-400 font-[family-name:var(--font-archivo)]">
              {salud.productosSaludables.toLocaleString('es-CO')} productos saludables
            </span>
          </div>

          {/* Barra de progreso segmentada tricolor */}
          <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-white/[0.04]">
            <div
              className="h-full bg-[#10b981] rounded-full shadow-[0_0_6px_rgba(16,185,129,0.5)]"
              style={{ width: `${pctOptimo}%` }}
              title={`Saludable: ${salud.productosSaludables}`}
            />
            <div
              className="h-full bg-[#f59e0b] rounded-full shadow-[0_0_6px_rgba(245,158,11,0.5)]"
              style={{ width: `${Math.max(4, pctBajo)}%` }}
              title={`Stock bajo: ${salud.stockBajoCount}`}
            />
            <div
              className="h-full bg-[#ef4444] rounded-full shadow-[0_0_6px_rgba(239,68,68,0.5)]"
              style={{ width: `${Math.max(3, pctAgotado)}%` }}
              title={`Agotado: ${salud.sinExistenciasCount}`}
            />
          </div>
        </div>

        {/* 3. Sub-encabezado: Requieren Atención */}
        <div className="flex items-center justify-between pt-3 pb-2 border-t border-white/[0.06]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-[family-name:var(--font-pixelify)]">
            Requieren atención
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/25 font-mono">
            {totalAlertas} productos
          </span>
        </div>

        {/* 4. Lista de Productos Críticos */}
        <div className="space-y-2 mt-1">
          {salud.alertasPrioritarias.map((item) => {
            const isCritico = item.estado === 'critico';
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      isCritico
                        ? 'bg-[#ef4444]/15 text-[#ef4444]'
                        : 'bg-[#f59e0b]/15 text-[#f59e0b]'
                    }`}
                  >
                    {isCritico ? <PackageXIcon size={14} /> : <TriangleAlertIcon size={14} />}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate font-[family-name:var(--font-archivo)]">
                      {item.nombre}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.sku}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-xs font-mono font-bold shrink-0 ${
                    isCritico ? 'text-[#ef4444]' : 'text-[#f59e0b]'
                  }`}
                >
                  {item.stockActual} {item.unidadMedida || 'uds.'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Acción de Reposición */}
      <button
        onClick={onGestionarReposicionClick}
        className="
          mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between w-full
          text-xs font-semibold text-[#e3b341] hover:text-[#f3d37a] transition-colors
          group cursor-pointer font-[family-name:var(--font-pixelify)] uppercase tracking-wider
        "
      >
        <span>Gestionar reposición</span>
        <span className="transform transition-transform duration-150 group-hover:translate-x-1">
          <ArrowRightIcon size={14} />
        </span>
      </button>
    </GlassCard>
  );
}
