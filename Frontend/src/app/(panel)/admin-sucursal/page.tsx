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
import { useRouter } from 'next/navigation';
import { useAuth, usePermissions } from '@/features/autenticacion';
import { Button3D } from '@/components/ui/Button3D';
import {
  BranchLayout,
  BranchSection,
  KpiMetricCard,
  SalesVelocityChart,
  InventoryHealthCard,
  RecentOperationsTable,
  ActiveCashiersCard,
  DashboardSkeleton,
  BranchInventoryView,
  BranchSuppliersView,
  DollarSignIcon,
  ReceiptTextIcon,
  PackageIcon,
  UsersRoundIcon,
  TrendingUpIcon,
  CalendarDaysIcon,
  ShieldIcon,
} from '@/features/admin-sucursal';
import { useBranchDashboard } from '@/features/admin-sucursal/hooks';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { usuario, esAdminSucursal, rolActual } = usePermissions();
  const [activeSection, setActiveSection] = useState<BranchSection>('resumen');

  // Hook desacoplado para gestión de datos de sede usando la sucursal del usuario
  const {
    data,
    isLoading: isDashboardLoading,
    periodo,
    cambiarPeriodo,
    recargar,
  } = useBranchDashboard({
    sucursalId: usuario?.sucursalId ?? 1,
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

  // RESTRICCIÓN ESTRICTA DE ROL: Solo admin-sucursal puede acceder a este dashboard
  if (!esAdminSucursal) {
    return (
      <div className="min-h-screen bg-[#0d1630] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#111d3f]/90 border border-amber-500/30 backdrop-blur-md shadow-2xl text-center space-y-5 animate-in fade-in duration-300">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldIcon size={32} />
          </div>

          <div>
            <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold font-[family-name:var(--font-pixelify)]">
              Acceso Restringido
            </span>
            <h1 className="text-2xl font-[family-name:var(--font-anton)] text-white tracking-wide uppercase mt-1">
              Solo Admin de Sucursal
            </h1>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed font-[family-name:var(--font-archivo)]">
              Este panel de control está reservado exclusivamente para cuentas con rol{' '}
              <strong className="text-amber-400">admin-sucursal</strong>.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 font-[family-name:var(--font-archivo)]">
              Rol actual detectado:{' '}
              <span className="font-semibold text-white uppercase">{rolActual || 'No autorizado'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Button3D
              size="md"
              className="w-full justify-center text-center font-bold"
              onClick={async () => {
                await logout();
                router.push('/acceso');
              }}
            >
              Iniciar como Admin de Sucursal
            </Button3D>

            <button
              onClick={() => router.push('/')}
              className="w-full py-2.5 px-4 rounded-xl border border-white/20 text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-xs font-[family-name:var(--font-pixelify)] uppercase cursor-pointer"
            >
              Volver al Inicio
            </button>
          </div>
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
      sucursalNombre={data?.sucursalNombre || 'Sede Norte'}
      ultimaSincronizacion={data?.ultimaSincronizacion || '17:42:08'}
      isOnline={isAuthenticated}
    >
      {activeSection === 'inventario' ? (
        <BranchInventoryView
          sucursalId={usuario?.sucursalId ?? 1}
          sucursalNombre={data?.sucursalNombre || 'Sede Norte'}
        />
      ) : activeSection === 'proveedores' ? (
        <BranchSuppliersView />
      ) : isDashboardLoading && !data ? (
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
    </BranchLayout>
  );
}
