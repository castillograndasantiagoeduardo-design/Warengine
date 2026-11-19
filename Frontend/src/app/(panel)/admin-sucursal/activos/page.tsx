'use client';

import React, { Suspense, useState } from 'react';
import { useAuth } from '@/features/autenticacion';
import {
  Pagination,
  LoadingState,
  ErrorState,
} from '@/features/admin-sucursal/components/shared';
import {
  AssetSummaryChips,
  AssetFilterBar,
  AssetTable,
  AssetDrawer,
  CreateAssetModal,
  EditAssetModal,
  DecommissionAssetModal,
  AssignAssetModal,
  ReturnAssetModal,
  RegisterMaintenanceModal,
} from '@/features/admin-sucursal/components/assets';
import { useBranchAssets } from '@/features/admin-sucursal/hooks/useBranchAssets';
import { branchAssetsService } from '@/features/admin-sucursal/api/branch-assets.service';
import type { ActivoSede } from '@/features/admin-sucursal/types/branch-assets.types';

function AssetsView() {
  const { usuario } = useAuth();
  const sucursalId = usuario?.sucursalId ?? 1;

  const {
    activos,
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
  } = useBranchAssets();

  const [activoParaMantenimiento, setActivoParaMantenimiento] = useState<ActivoSede | null>(null);

  return (
    <div className="space-y-4">
      {/* Chips de Resumen Patrimonial */}
      <AssetSummaryChips
        resumen={resumen}
        estadoSeleccionado={filtros.estado}
        onSelectEstado={handlers.handleFiltrarEstado}
      />

      {/* Barra de Búsqueda y Filtros */}
      <AssetFilterBar
        terminoBusqueda={filtros.terminoBusqueda}
        categoriaActivoId={filtros.categoriaActivoId}
        estado={filtros.estado}
        onBuscar={handlers.handleBuscar}
        onFiltrarCategoria={handlers.handleFiltrarCategoria}
        onFiltrarEstado={handlers.handleFiltrarEstado}
        onLimpiar={handlers.handleLimpiarFiltros}
        onNuevoActivo={() => modales.setIsCreateOpen(true)}
      />

      {/* Contenido principal: Tabla de activos dentro de vidrio */}
      {cargando ? (
        <LoadingState rows={6} />
      ) : error ? (
        <ErrorState
          title="Error al consultar activos"
          message={error}
          onRetry={handlers.recargar}
        />
      ) : (
        <div className="vidrio rounded-2xl border border-white/[0.08] overflow-hidden">
          <AssetTable
            activos={activos}
            cargando={false}
            onVerDetalle={modales.setActivoSeleccionado}
            onEditar={modales.setActivoParaEditar}
            onAsignar={modales.setActivoParaAsignar}
            onDevolver={modales.setActivoParaDevolver}
            onDarBaja={modales.setActivoParaBaja}
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

      {/* Ficha Lateral de Detalle del Activo */}
      <AssetDrawer
        activo={modales.activoSeleccionado}
        onClose={() => modales.setActivoSeleccionado(null)}
        onEditar={modales.setActivoParaEditar}
        onAsignar={modales.setActivoParaAsignar}
        onDevolver={modales.setActivoParaDevolver}
        onDarBaja={modales.setActivoParaBaja}
        onProgramarMantenimiento={(act) => setActivoParaMantenimiento(act)}
      />

      {/* Modales Operativos */}
      <CreateAssetModal
        open={modales.isCreateOpen}
        onClose={() => modales.setIsCreateOpen(false)}
        onSubmit={operaciones.crearActivo}
      />

      <EditAssetModal
        activo={modales.activoParaEditar}
        onClose={() => modales.setActivoParaEditar(null)}
        onSubmit={operaciones.editarActivo}
      />

      <DecommissionAssetModal
        activo={modales.activoParaBaja}
        onClose={() => modales.setActivoParaBaja(null)}
        onConfirm={operaciones.darBajaActivo}
      />

      <AssignAssetModal
        activo={modales.activoParaAsignar}
        sucursalId={sucursalId}
        onClose={() => modales.setActivoParaAsignar(null)}
        onAsignarEmpleado={operaciones.asignarEmpleado}
        onAsignarArea={operaciones.asignarArea}
      />

      <ReturnAssetModal
        activo={modales.activoParaDevolver}
        onClose={() => modales.setActivoParaDevolver(null)}
        onConfirm={operaciones.devolverActivo}
      />

      <RegisterMaintenanceModal
        open={Boolean(activoParaMantenimiento)}
        sucursalId={sucursalId}
        activoPreseleccionado={activoParaMantenimiento}
        onClose={() => setActivoParaMantenimiento(null)}
        onSubmit={async (id, datos) => {
          await branchAssetsService.registrarMantenimiento(id, datos);
          await handlers.recargar();
        }}
      />
    </div>
  );
}

export default function AdminSucursalActivosPage() {
  return (
    <Suspense fallback={<LoadingState rows={6} />}>
      <AssetsView />
    </Suspense>
  );
}
