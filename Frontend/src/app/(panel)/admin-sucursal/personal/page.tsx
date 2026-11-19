'use client';

/**
 * /admin-sucursal/personal — Pestaña 1: Directorio de colaboradores de la sede.
 */

import React, { Suspense } from 'react';
import { Users, UserX } from 'lucide-react';
import {
  Pagination,
  LoadingState,
  EmptyState,
  ErrorState,
} from '@/features/admin-sucursal/components/shared';
import {
  StaffFilterBar,
  StaffTable,
  StaffDrawer,
} from '@/features/admin-sucursal/components/staff';
import { useBranchStaff } from '@/features/admin-sucursal/hooks/useBranchStaff';

function StaffView() {
  const {
    empleados,
    total,
    totalPaginas,
    paginaActual,
    cargando,
    error,
    recargar,
    terminoBusqueda,
    setTerminoBusqueda,
    cargoActual,
    estadoActual,
    cambiarPagina,
    cambiarCargo,
    cambiarEstado,
    limpiarFiltros,
    hayFiltrosActivos,
    empleadoSeleccionado,
    abrirFicha,
    cerrarFicha,
  } = useBranchStaff();

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <StaffFilterBar
        busqueda={terminoBusqueda}
        onBusquedaChange={setTerminoBusqueda}
        cargo={cargoActual}
        onCargoChange={cambiarCargo}
        estado={estadoActual}
        onEstadoChange={cambiarEstado}
        hayFiltrosActivos={hayFiltrosActivos}
        onLimpiarFiltros={limpiarFiltros}
      />

      {/* Estados y tabla */}
      {cargando ? (
        <LoadingState rows={6} />
      ) : error ? (
        <ErrorState
          title="Error al cargar personal"
          message={error}
          onRetry={recargar}
        />
      ) : empleados.length === 0 ? (
        hayFiltrosActivos ? (
          <EmptyState
            title="No se encontraron colaboradores"
            description="No hay resultados que coincidan con los filtros y término de búsqueda aplicados."
            icon={<Users className="w-6 h-6 text-slate-400" />}
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
            title="Sin personal registrado"
            description="No se registran empleados asignados actualmente a esta sede."
            icon={<UserX className="w-6 h-6 text-slate-400" />}
          />
        )
      ) : (
        <div className="space-y-4">
          <StaffTable
            empleados={empleados}
            onVerFicha={abrirFicha}
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

      {/* Panel lateral con la ficha del empleado */}
      <StaffDrawer
        empleado={empleadoSeleccionado}
        onClose={cerrarFicha}
      />
    </div>
  );
}

export default function AdminSucursalPersonalPage() {
  return (
    <Suspense fallback={<LoadingState rows={6} />}>
      <StaffView />
    </Suspense>
  );
}
