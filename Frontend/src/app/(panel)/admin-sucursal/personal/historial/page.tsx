'use client';

/**
 * /admin-sucursal/personal/historial — Pestaña 3: Historial de turnos y arqueos cerrados.
 */

import React, { Suspense } from 'react';
import { History, CalendarX } from 'lucide-react';
import {
  Pagination,
  LoadingState,
  EmptyState,
  ErrorState,
} from '@/features/admin-sucursal/components/shared';
import {
  ShiftHistoryFilterBar,
  ShiftHistoryTable,
  ShiftCutDetailModal,
} from '@/features/admin-sucursal/components/staff';
import { useShiftHistory } from '@/features/admin-sucursal/hooks/useShiftHistory';

function ShiftHistoryView() {
  const {
    turnos,
    total,
    totalPaginas,
    paginaActual,
    cargando,
    error,
    recargar,
    desde,
    hasta,
    tipoCierreActual,
    conDiferencia,
    cambiarPagina,
    cambiarDesde,
    cambiarHasta,
    cambiarTipoCierre,
    toggleConDiferencia,
    aplicarAtajoFecha,
    limpiarFiltros,
    hayFiltrosActivos,
    turnoSeleccionadoCorte,
    corteDetalle,
    cargandoCorte,
    errorCorte,
    abrirCorte,
    cerrarCorte,
  } = useShiftHistory();

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <ShiftHistoryFilterBar
        desde={desde}
        hasta={hasta}
        onDesdeChange={cambiarDesde}
        onHastaChange={cambiarHasta}
        tipoCierre={tipoCierreActual}
        onTipoCierreChange={cambiarTipoCierre}
        conDiferencia={conDiferencia}
        onToggleConDiferencia={toggleConDiferencia}
        onAtajoFecha={aplicarAtajoFecha}
        hayFiltrosActivos={hayFiltrosActivos}
        onLimpiarFiltros={limpiarFiltros}
      />

      {/* Estados y tabla */}
      {cargando ? (
        <LoadingState rows={6} />
      ) : error ? (
        <ErrorState
          title="Error al consultar historial de turnos"
          message={error}
          onRetry={recargar}
        />
      ) : turnos.length === 0 ? (
        hayFiltrosActivos ? (
          <EmptyState
            title="No se encontraron turnos cerrados"
            description="No hay registros que coincidan con el rango de fechas o filtros aplicados."
            icon={<CalendarX className="w-6 h-6 text-slate-400" />}
            action={
              <button
                type="button"
                onClick={limpiarFiltros}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
              >
                Limpiar filtros
              </button>
            }
          />
        ) : (
          <EmptyState
            title="Sin historial de turnos"
            description="Aún no se han cerrado turnos de caja en esta sede."
            icon={<History className="w-6 h-6 text-slate-400" />}
          />
        )
      ) : (
        <div className="space-y-4">
          <ShiftHistoryTable
            turnos={turnos}
            onVerCorte={abrirCorte}
          />

          {totalPaginas > 1 && (
            <div className="vidrio rounded-2xl border border-white/[0.08] overflow-hidden">
              <Pagination
                page={paginaActual}
                totalPages={totalPaginas}
                total={total}
                onPageChange={cambiarPagina}
              />
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalle de Corte y Liquidación */}
      <ShiftCutDetailModal
        open={Boolean(turnoSeleccionadoCorte)}
        onClose={cerrarCorte}
        corte={corteDetalle}
        cargando={cargandoCorte}
        error={errorCorte}
      />
    </div>
  );
}

export default function ShiftHistoryPage() {
  return (
    <Suspense fallback={<LoadingState rows={6} />}>
      <ShiftHistoryView />
    </Suspense>
  );
}
