'use client';

/**
 * BranchOverviewView.tsx — Vista de Resumen y KPIs de la Sucursal (Dashboard Ejecutivo).
 * 
 * Principios SOLID:
 * - Single Responsibility Principle (SRP): Orquesta exclusivamente la cuadrícula de métricas,
 *   gráfica de velocidad de ventas, salud de inventario, operaciones recientes y turnos en curso.
 */

import React from 'react';
import { KpiMetricCard } from './KpiMetricCard';
import { SalesVelocityChart } from './SalesVelocityChart';
import { InventoryHealthCard } from './InventoryHealthCard';
import { RecentOperationsTable } from './RecentOperationsTable';
import { ActiveCashiersCard } from './ActiveCashiersCard';
import {
  DollarSignIcon,
  ReceiptTextIcon,
  PackageIcon,
  UsersRoundIcon,
  TrendingUpIcon,
  CalendarDaysIcon,
} from './Icons';
import type { BranchDashboardData } from '../types/branch-dashboard.types';
import type { BranchSection } from './BranchSidebar';

interface BranchOverviewViewProps {
  data: BranchDashboardData;
  onNavigateSection?: (section: BranchSection) => void;
  className?: string;
}

/** '+12.5%' / '-3%' solo cuando hay comparación real; sin base no se muestra insignia. */
function textoVariacion(porcentaje: number | null): string | undefined {
  if (porcentaje === null) return undefined;
  return `${porcentaje >= 0 ? '+' : ''}${porcentaje}% vs ayer`;
}

export function BranchOverviewView({
  data,
  onNavigateSection,
  className = '',
}: BranchOverviewViewProps) {
  return (
    <div className={`space-y-5 animate-in fade-in duration-300 ${className}`}>
      
      {/* 1. Encabezado del Resumen con Fecha de Operación */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-white/[0.04]">
        <div>
          <h1 className="text-2xl font-[family-name:var(--font-anton)] tracking-wider text-white uppercase">
            Resumen de sucursal
          </h1>
          <p className="text-xs text-slate-400 font-[family-name:var(--font-archivo)]">
            Todo lo que necesitas para mantener tu sede en movimiento.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-300">
          <span className="text-[#e3b341]">
            <CalendarDaysIcon size={15} />
          </span>
          <span className="font-[family-name:var(--font-archivo)]">
            {data.fechaOperacion}
          </span>
        </div>
      </div>

      {/* 2. Cuadrícula de 4 Tarjetas KPI */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ventas del Día */}
        <KpiMetricCard
          title="Ventas del Día"
          value={data.kpis.ventas.valorFormateado}
          icon={<DollarSignIcon size={18} />}
          trendText={textoVariacion(data.kpis.ventas.porcentajeCambio)}
          trendVariant={(data.kpis.ventas.porcentajeCambio ?? 0) >= 0 ? 'success' : 'warning'}
          trendIcon={<TrendingUpIcon size={12} />}
          contextText={data.kpis.ventas.comparativaTexto}
        />

        {/* KPI 2: Transacciones */}
        <KpiMetricCard
          title="Transacciones"
          value={data.kpis.transacciones.total}
          icon={<ReceiptTextIcon size={18} />}
          trendText={textoVariacion(data.kpis.transacciones.porcentajeCambio)}
          trendVariant={(data.kpis.transacciones.porcentajeCambio ?? 0) >= 0 ? 'success' : 'warning'}
          trendIcon={<TrendingUpIcon size={12} />}
          contextText={`Ticket promedio: ${data.kpis.transacciones.ticketPromedioFormateado}`}
        />

        {/* KPI 3: Productos en Catálogo */}
        <KpiMetricCard
          title="Productos en la sede"
          value={data.kpis.stock.totalProductos.toLocaleString('es-CO')}
          icon={<PackageIcon size={18} />}
          trendText={`${data.kpis.stock.totalAlertas} alertas`}
          trendVariant="warning"
          contextText={`${data.kpis.stock.stockBajo} bajos · ${data.kpis.stock.agotados} agotados`}
        />

        {/* KPI 4: Cajeros Activos */}
        <KpiMetricCard
          title="Cajeros en turno"
          value={data.kpis.cajeros.turnosAbiertos}
          icon={<UsersRoundIcon size={18} />}
          trendText={data.kpis.cajeros.turnosAbiertos > 0 ? 'En línea' : undefined}
          trendVariant="success"
          pulseDot={data.kpis.cajeros.turnosAbiertos > 0}
          contextText={`${data.kpis.cajeros.total} empleados en la sede`}
        />
      </section>

      {/* 3. Fila Intermedia (65% / 35%): Gráfica de Ventas y Salud de Inventario */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <SalesVelocityChart
            data={data.velocidadVentas}
            className="h-full"
          />
        </div>

        <div className="lg:col-span-4">
          <InventoryHealthCard
            data={data.saludInventario}
            className="h-full"
          />
        </div>
      </section>

      {/* 4. Fila Inferior (65% / 35%): Operaciones Recientes y Turnos en Curso */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <RecentOperationsTable
            facturas={data.operacionesRecientes}
            onVerTodasClick={() => onNavigateSection?.('facturacion')}
            className="h-full"
          />
        </div>

        <div className="lg:col-span-4">
          <ActiveCashiersCard
            turnos={data.cajerosEnTurno}
            onAdministrarTurnosClick={() => onNavigateSection?.('cajeros')}
            className="h-full"
          />
        </div>
      </section>

    </div>
  );
}
