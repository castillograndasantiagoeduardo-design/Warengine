'use client';

import React, { useState } from 'react';
import { MetricKpiCard } from '@/components/panel/MetricKpiCard';
import { TrendSalesChart } from '@/components/panel/TrendSalesChart';
import { BranchPerformanceChart } from '@/components/panel/BranchPerformanceChart';
import { ProductRotationCard } from '@/components/panel/ProductRotationCard';
import { AlertsFeedCard } from '@/components/panel/AlertsFeedCard';
import { Button3D } from '@/components/ui/Button3D';

export default function DashboardAdminPage() {
  const [periodo, setPeriodo] = useState<'hoy' | '7dias' | 'mes' | 'anio'>('mes');

  return (
    <div className="space-y-6">
      {/* Barra de Bienvenida y Filtros Rápidos */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#121d3d] via-[#0f1730] to-[#0c1326] border border-white/10 select-none backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e3b341] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#e3b341] font-[family-name:var(--font-pixelify)]">
              PANEL EJECUTIVO MULTI-SEDE
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 font-[family-name:var(--font-archivo)] tracking-tight">
            Consolidado Financiero & Operativo
          </h2>
          <p className="text-xs text-white/60 mt-0.5 font-[family-name:var(--font-archivo)]">
            Métricas de ingresos, costos de inventario, márgenes y rendimiento comercial en tiempo real
          </p>
        </div>

        {/* Filtros de Rango Temporal */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10">
            {(
              [
                { id: 'hoy', label: 'Hoy' },
                { id: '7dias', label: '7 Días' },
                { id: 'mes', label: 'Este Mes' },
                { id: 'anio', label: 'Este Año' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodo(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer font-[family-name:var(--font-pixelify)] ${
                  periodo === p.id
                    ? 'bg-[#e3b341] text-[#111111] shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button3D
            onClick={() => alert('Generando informe ejecutivo consolidado en PDF...')}
            className="text-xs py-2 px-3.5"
          >
            Descargar Reporte PDF
          </Button3D>
        </div>
      </div>

      {/* Grid de KPIs Financieros Principales (RF-ADM-A1) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="KPIs Financieros">
        <MetricKpiCard
          title="Ingresos Totales Brutos"
          value="$128.450.000"
          subtitle="452 facturas emitidas"
          trend={{ value: '14.2%', isPositive: true, label: 'vs periodo anterior' }}
          accent="gold"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <MetricKpiCard
          title="Costo de Ventas (COGS)"
          value="$74.120.000"
          subtitle="Costo adquisición inventario"
          trend={{ value: '2.1%', isPositive: true, label: 'eficiencia de compra' }}
          accent="blue"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
        />

        <MetricKpiCard
          title="Ganancia Bruta Neta"
          value="$54.330.000"
          subtitle="Ingresos menos Costos"
          trend={{ value: '18.5%', isPositive: true, label: 'utilidad neta al alza' }}
          accent="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />

        <MetricKpiCard
          title="Margen de Utilidad"
          value="42.3%"
          subtitle="Meta proyectada: > 38.0%"
          trend={{ value: '3.8%', isPositive: true, label: 'sobre meta anual' }}
          accent="rose"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </section>

      {/* Fila Gráfica Analítica: Tendencias & Rendimiento Sucursales */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendSalesChart />
        <BranchPerformanceChart />
      </section>

      {/* Fila Operativa: Rotación de Productos & Alertas Críticas */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductRotationCard />
        <AlertsFeedCard />
      </section>
    </div>
  );
}
