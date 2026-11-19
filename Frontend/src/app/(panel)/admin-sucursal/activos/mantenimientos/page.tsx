'use client';

import React, { Suspense } from 'react';
import { useAuth } from '@/features/autenticacion';
import {
  Pagination,
  LoadingState,
  ErrorState,
} from '@/features/admin-sucursal/components/shared';
import {
  MaintenanceFilterBar,
  MaintenanceTable,
  RegisterMaintenanceModal,
  FinalizeMaintenanceModal,
} from '@/features/admin-sucursal/components/assets';
import { useAssetMaintenance } from '@/features/admin-sucursal/hooks/useAssetMaintenance';

function MaintenanceView() {
  const { usuario } = useAuth();
  const sucursalId = usuario?.sucursalId ?? 1;

  const {
    mantenimientos,
    resumen,
    total,
    totalPages,
    page,
    cargando,
    error,
    filtros,
    handlers,
    modales,
    operaciones,
  } = useAssetMaintenance({ sucursalId });

  return (
    <div className="space-y-4">
      {/* Indicadores rápidos de Mantenimiento */}
      {resumen && (
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.02] text-xs">
            <span className="text-neutral-400">Total servicios:</span>
            <span className="font-semibold text-neutral-200">{resumen.total}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>En curso:</span>
            <span className="font-semibold">{resumen.enCurso}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Finalizados:</span>
            <span className="font-semibold">{resumen.finalizados}</span>
          </div>

          {resumen.vencidos > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-300">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Con retraso:</span>
              <span className="font-semibold">{resumen.vencidos}</span>
            </div>
          )}
        </div>
      )}

      {/* Barra de Filtros */}
      <MaintenanceFilterBar
        estado={filtros.estado}
        tipo={filtros.tipo}
        desde={filtros.desde}
        hasta={filtros.hasta}
        onCambiarEstado={handlers.handleCambiarEstado}
        onCambiarTipo={handlers.handleCambiarTipo}
        onCambiarFechas={handlers.handleCambiarFechas}
        onLimpiar={handlers.handleLimpiarFiltros}
        onNuevoMantenimiento={() => modales.setIsRegisterOpen(true)}
      />

      {/* Contenido: Tabla dentro de vidrio */}
      {cargando ? (
        <LoadingState rows={6} />
      ) : error ? (
        <ErrorState
          title="Error al consultar mantenimientos"
          message={error}
          onRetry={handlers.recargar}
        />
      ) : (
        <div className="vidrio rounded-2xl border border-white/[0.08] overflow-hidden">
          <MaintenanceTable
            mantenimientos={mantenimientos}
            cargando={false}
            onFinalizar={modales.setMantenimientoParaFinalizar}
          />

          {totalPages > 1 && (
            <div className="border-t border-white/5">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={handlers.handleCambiarPagina}
              />
            </div>
          )}
        </div>
      )}

      {/* Modales */}
      <RegisterMaintenanceModal
        open={modales.isRegisterOpen}
        sucursalId={sucursalId}
        onClose={() => modales.setIsRegisterOpen(false)}
        onSubmit={operaciones.registrarMantenimiento}
      />

      <FinalizeMaintenanceModal
        mantenimiento={modales.mantenimientoParaFinalizar}
        onClose={() => modales.setMantenimientoParaFinalizar(null)}
        onConfirm={operaciones.finalizarMantenimiento}
      />
    </div>
  );
}

export default function AdminSucursalMantenimientosPage() {
  return (
    <Suspense fallback={<LoadingState rows={6} />}>
      <MaintenanceView />
    </Suspense>
  );
}
