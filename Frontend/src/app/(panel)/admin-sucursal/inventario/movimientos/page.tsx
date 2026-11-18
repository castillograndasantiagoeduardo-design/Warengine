'use client';

/**
 * /admin-sucursal/inventario/movimientos — Trazabilidad Kardex y Entradas de mercancía.
 * Incluye selector segmentado [ Kardex general | Entradas de mercancía ] sincronizado con ?tab=
 */

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { usePermissions } from '@/features/autenticacion';
import {
  KardexView,
  StockEntriesView,
  EntryDetailModal,
  VoidStockEntryModal,
} from '@/features/admin-sucursal/components/inventory';
import { RegisterStockEntryModal } from '@/features/admin-sucursal';
import { branchInventoryService } from '@/features/admin-sucursal/api/branch-inventory.service';
import { LoadingState } from '@/features/admin-sucursal/components/shared/States';
import type {
  EntradaMercanciaItem,
  ProductoInventarioSede,
  ProveedorInventario,
} from '@/features/admin-sucursal/types/branch-inventory.types';

function MovimientosContenido() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { usuario } = usePermissions();

  const sucursalId = usuario?.sucursalId ?? 1;

  // Tab activo: 'kardex' | 'entradas'
  const tabParam = searchParams.get('tab') === 'entradas' ? 'entradas' : 'kardex';
  const [activeTab, setActiveTab] = useState<'kardex' | 'entradas'>(tabParam);
  const productoIdParam = searchParams.get('productoId') || '';

  // Metadatos para registro de entradas
  const [productos, setProductos] = useState<ProductoInventarioSede[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorInventario[]>([]);

  // Modales
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [entradaSeleccionada, setEntradaSeleccionada] = useState<EntradaMercanciaItem | null>(null);

  // Key de recarga para refrescar tablas cuando se registra o anula una entrada
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  useEffect(() => {
    // Cargar productos y proveedores para el modal de registrar entrada
    Promise.all([
      branchInventoryService.listarInventarioSede(sucursalId, { limit: 100 }),
      branchInventoryService.listarProveedores(),
    ])
      .then(([inv, provs]) => {
        setProductos(inv.items);
        setProveedores(provs);
      })
      .catch(() => {});
  }, [sucursalId]);

  const handleSelectTab = (tab: 'kardex' | 'entradas') => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleRecargarEntradas = () => {
    setReloadKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Selector segmentado superior */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => handleSelectTab('kardex')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'kardex'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
              : 'bg-white/5 hover:bg-white/10 text-white/70'
          }`}
        >
          Kardex general de movimientos
        </button>
        <button
          type="button"
          onClick={() => handleSelectTab('entradas')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'entradas'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
              : 'bg-white/5 hover:bg-white/10 text-white/70'
          }`}
        >
          Entradas de mercancía
        </button>
      </div>

      {/* Contenido según pestaña */}
      {activeTab === 'kardex' ? (
        <KardexView
          key={`kardex-${reloadKey}`}
          sucursalId={sucursalId}
          productoIdInicial={productoIdParam}
        />
      ) : (
        <StockEntriesView
          key={`entradas-${reloadKey}`}
          sucursalId={sucursalId}
          proveedores={proveedores}
          onRegistrarEntrada={() => setRegisterModalOpen(true)}
          onVerDetalle={(e) => {
            setEntradaSeleccionada(e);
            setDetailModalOpen(true);
          }}
          onAnularEntrada={(e) => {
            setEntradaSeleccionada(e);
            setVoidModalOpen(true);
          }}
        />
      )}

      {/* Modal: Registrar Entrada */}
      <RegisterStockEntryModal
        isOpen={registerModalOpen}
        sucursalId={sucursalId}
        productos={productos}
        proveedores={proveedores}
        onClose={() => setRegisterModalOpen(false)}
        onRegistrar={async (dto) => {
          try {
            await branchInventoryService.registrarEntrada(dto);
            handleRecargarEntradas();
            return { ok: true };
          } catch (err: any) {
            return { ok: false, error: err?.message };
          }
        }}
      />

      {/* Modal: Ver Detalle de Entrada */}
      <EntryDetailModal
        open={detailModalOpen}
        entrada={entradaSeleccionada}
        onClose={() => setDetailModalOpen(false)}
        onAnular={(e) => {
          setEntradaSeleccionada(e);
          setVoidModalOpen(true);
        }}
      />

      {/* Modal: Anular Entrada con Confirmación y Motivo */}
      <VoidStockEntryModal
        open={voidModalOpen}
        entrada={entradaSeleccionada}
        onClose={() => setVoidModalOpen(false)}
        onAnulada={handleRecargarEntradas}
      />
    </div>
  );
}

export default function AdminSucursalInventarioMovimientosPage() {
  return (
    <Suspense
      fallback={
        <div className="vidrio rounded-2xl p-6">
          <LoadingState rows={6} />
        </div>
      }
    >
      <MovimientosContenido />
    </Suspense>
  );
}
