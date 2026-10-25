'use client';

/**
 * DashboardPage — Panel de control operativo y analítico para Admin de Sucursal (WarEngine).
 *
 * Principios SOLID:
 * - Single Responsibility (SRP): Coordina las vistas del dashboard administrativo de sede.
 * - Dependency Inversion (DIP): Los datos y acciones provienen de hooks tipados (useAuth, useBranchDashboard).
 * - Open/Closed (OCP): Estructura modular extensible por secciones sin reescribir el layout.
 *
 * Estándar visual: Fiel al diseño de Figma (nodo 0:1) y warengine-ui/SKILL.md.
 */

import React, { useState } from 'react';
import { useAuth } from '@/features/autenticacion';
import {
  BranchLayout,
  BranchSection,
  KpiMetricCard,
  SalesVelocityChart,
  InventoryHealthCard,
  RecentOperationsTable,
  ActiveCashiersCard,
  CreateProductModal,
  DashboardSkeleton,
  DollarSignIcon,
  ReceiptTextIcon,
  PackageIcon,
  UsersRoundIcon,
  TrendingUpIcon,
  CalendarDaysIcon,
} from '@/features/administracion';
import { useBranchDashboard } from '@/features/administracion/hooks';

export default function DashboardPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [activeSection, setActiveSection] = useState<BranchSection>('resumen');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hook desacoplado para gestión de datos de sede
  const {
    data,
    isLoading: isDashboardLoading,
    periodo,
    cambiarPeriodo,
    recargar,
  } = useBranchDashboard({
    sucursalId: 1,
    periodoInicial: 'hoy',
    autoRefreshIntervalMs: 60000, // Refresco en segundo plano cada 60s
  });

  // Estado de carga inicial de autenticación
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0d1630] flex items-center justify-center text-[#e3b341] font-[family-name:var(--font-pixelify)]">
        <div className="flex flex-col items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e3b341] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#e3b341]" />
          </span>
          <span>Iniciando sesión segura WarEngine...</span>
        </div>
      </div>
    );
  }

  return (
    <BranchLayout
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      periodo={periodo}
      onPeriodoChange={cambiarPeriodo}
      onNuevoProductoClick={() => setIsModalOpen(true)}
      sucursalNombre={data?.sucursalNombre || 'Sede Norte'}
      ultimaSincronizacion={data?.ultimaSincronizacion || '17:42:08'}
      isOnline={isAuthenticated}
    >
      {isDashboardLoading && !data ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-5 animate-in fade-in duration-300">
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
                {data?.fechaOperacion || 'Domingo, 25 de octubre de 2026'}
              </span>
            </div>
          </div>

          {/* 2. Cuadrícula de 4 Tarjetas KPI */}
          {data && (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1: Ventas del Día */}
              <KpiMetricCard
                title="Ventas del Día"
                value={data.kpis.ventas.valorFormateado}
                icon={<DollarSignIcon size={18} />}
                trendText={`+${data.kpis.ventas.porcentajeCambio}%`}
                trendVariant="success"
                trendIcon={<TrendingUpIcon size={12} />}
                contextText={data.kpis.ventas.comparativaTexto}
              />

              {/* KPI 2: Transacciones */}
              <KpiMetricCard
                title="Transacciones"
                value={data.kpis.transacciones.total}
                icon={<ReceiptTextIcon size={18} />}
                trendText={`+${data.kpis.transacciones.porcentajeCambio}%`}
                trendVariant="success"
                trendIcon={<TrendingUpIcon size={12} />}
                contextText={`Ticket promedio: ${data.kpis.transacciones.ticketPromedioFormateado}`}
              />

              {/* KPI 3: Productos en Catálogo */}
              <KpiMetricCard
                title="Productos en catálogo"
                value={data.kpis.stock.totalProductos.toLocaleString('es-CO')}
                icon={<PackageIcon size={18} />}
                trendText={`${data.kpis.stock.totalAlertas} alertas`}
                trendVariant="warning"
                contextText={`${data.kpis.stock.stockBajo} bajos · ${data.kpis.stock.agotados} agotados`}
              />

              {/* KPI 4: Cajeros Activos */}
              <KpiMetricCard
                title="Cajeros activos"
                value={`${data.kpis.cajeros.activos} / ${data.kpis.cajeros.total}`}
                icon={<UsersRoundIcon size={18} />}
                trendText="En línea"
                trendVariant="success"
                pulseDot
                contextText={`${data.kpis.cajeros.turnosAbiertos} turnos abiertos · ${data.kpis.cajeros.disponibles} disponible`}
              />
            </section>
          )}

          {/* 3. Fila Intermedia (65% / 35%): Gráfica de Ventas y Salud de Inventario */}
          {data && (
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
          )}

          {/* 4. Fila Inferior (65% / 35%): Operaciones Recientes y Turnos en Curso */}
          {data && (
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8">
                <RecentOperationsTable
                  facturas={data.operacionesRecientes}
                  className="h-full"
                />
              </div>

              <div className="lg:col-span-4">
                <ActiveCashiersCard
                  turnos={data.cajerosEnTurno}
                  className="h-full"
                />
              </div>
            </section>
          )}
        </div>
      )}

      {/* 5. Modal de Creación Rápida de Producto */}
      <CreateProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProductoCreado={recargar}
      />
    </BranchLayout>
  );
}
