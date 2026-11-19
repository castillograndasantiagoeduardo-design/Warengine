'use client';

/**
 * BranchStaffView.tsx — Componente contenedor retrocompatible para la gestión de personal de sede.
 *
 * @deprecated En Fase 4, la gestión de personal fue modularizada en subrutas de App Router:
 * - /admin-sucursal/personal (Directorio de empleados)
 * - /admin-sucursal/personal/turnos (Turnos activos y cierre administrativo)
 * - /admin-sucursal/personal/historial (Historial y detalle de corte)
 *
 * Este componente se mantiene por compatibilidad y delega en los componentes ejecutivos de staff.
 */

import React from 'react';
import { StaffFilterBar } from './staff/StaffFilterBar';
import { StaffTable } from './staff/StaffTable';
import { StaffDrawer } from './staff/StaffDrawer';
import { LoadingState, EmptyState, ErrorState, Pagination } from './shared';
import { useBranchStaff } from '../hooks/useBranchStaff';
import { Users, UserX } from 'lucide-react';

export interface BranchStaffViewProps {
  sucursalId: number;
  sucursalNombre: string;
  className?: string;
}

export function BranchStaffView({
  sucursalId,
  sucursalNombre,
  className = '',
}: BranchStaffViewProps) {
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
  } = useBranchStaff({ sucursalId });

  return (
    <div className={`space-y-4 ${className}`}>
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

      {/* Estados y contenido */}
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
            title="Sin colaboradores registrados"
            description={`No hay registros de empleados asignados a ${sucursalNombre}.`}
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

      {/* Panel lateral Ficha del colaborador */}
      <StaffDrawer
        empleado={empleadoSeleccionado}
        onClose={cerrarFicha}
      />
    </div>
  );
}
