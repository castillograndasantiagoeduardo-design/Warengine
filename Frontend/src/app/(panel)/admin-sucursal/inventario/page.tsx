'use client';

/**
 * /admin-sucursal/inventario — Catálogo de productos y existencias de sede.
 * Vista principal rediseñada con glassmorphism, KPIs interactivos y acciones modales.
 */

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { usePermissions } from '@/features/autenticacion';
import { useBranchInventory } from '@/features/admin-sucursal';
import {
  InventoryKpiCards,
  ProductsFilterBar,
  ProductsTable,
  ProductDrawer,
  PriceHistoryModal,
  ImportProductsModal,
  AdjustMinStockModal,
} from '@/features/admin-sucursal/components/inventory';
import {
  CreateProductModal,
  EditProductModal,
  RegisterStockEntryModal,
  BranchKardexModal,
} from '@/features/admin-sucursal';
import { Pagination } from '@/features/admin-sucursal/components/shared/Pagination';
import { LoadingState, EmptyState } from '@/features/admin-sucursal/components/shared/States';
import { branchInventoryService } from '@/features/admin-sucursal/api/branch-inventory.service';
import type { ProductoInventarioSede } from '@/features/admin-sucursal/types/branch-inventory.types';

function InventarioProductosContenido() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { usuario } = usePermissions();

  const sucursalId = usuario?.sucursalId ?? 1;
  const sucursalNombre = usuario?.sucursalNombre ?? `Sede #${sucursalId}`;

  // Leer estado de la URL
  const qParam = searchParams.get('q') || '';
  const categoriaParam = searchParams.get('categoriaId');
  const estadoParam = searchParams.get('estado') || 'activo';
  const nivelParam = searchParams.get('nivel') || 'todos';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const {
    productos,
    total,
    page,
    totalPages,
    resumen,
    categorias,
    proveedores,
    isLoading,
    filtros,
    actualizarFiltros,
    cambiarPagina,
    recargar,
    editarProducto,
    cambiarEstado,
  } = useBranchInventory({
    sucursalId,
    initialFiltros: {
      texto: qParam,
      categoriaId: categoriaParam ? Number(categoriaParam) : undefined,
      sinCategoria: categoriaParam === '-1',
      estado: estadoParam as any,
      nivelStock: nivelParam as any,
      page: pageParam,
    },
  });

  // Estado para modales y drawer
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoInventarioSede | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [priceHistoryModalOpen, setPriceHistoryModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [minStockModalOpen, setMinStockModalOpen] = useState(false);
  const [kardexModalOpen, setKardexModalOpen] = useState(false);
  const [kardexMovimientos, setKardexMovimientos] = useState<any[]>([]);
  const [kardexLoading, setKardexLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Sincronizar URL cuando cambian los filtros
  const actualizarUrl = (nuevos: Record<string, string | number | undefined | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(nuevos).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '' || val === 'todos') {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCambiarFiltros = (nuevos: {
    texto?: string;
    categoriaId?: number;
    sinCategoria?: boolean;
    estado?: 'todos' | 'activo' | 'inactivo';
  }) => {
    actualizarFiltros({
      texto: nuevos.texto,
      categoriaId: nuevos.sinCategoria ? -1 : nuevos.categoriaId,
      sinCategoria: nuevos.sinCategoria,
      estado: nuevos.estado,
    });
    actualizarUrl({
      q: nuevos.texto,
      categoriaId: nuevos.sinCategoria ? -1 : nuevos.categoriaId,
      estado: nuevos.estado !== 'activo' ? nuevos.estado : undefined,
      page: 1,
    });
  };

  const handleSelectNivel = (nivel: 'todos' | 'optimo' | 'bajo' | 'agotado') => {
    actualizarFiltros({ nivelStock: nivel });
    actualizarUrl({ nivel, page: 1 });
  };

  const handlePageChange = (nuevaPagina: number) => {
    cambiarPagina(nuevaPagina);
    actualizarUrl({ page: nuevaPagina > 1 ? nuevaPagina : undefined });
  };

  // Exportar CSV
  const handleExportarCsv = async () => {
    setIsExporting(true);
    try {
      const blob = await branchInventoryService.exportarProductosCsv({
        ...filtros,
        sucursalId,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventario_sede_${sucursalId}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.message || 'Error al descargar catálogo de productos.');
    } finally {
      setIsExporting(false);
    }
  };

  // Consultar Kardex para el modal rápido
  const handleConsultarKardexRapido = async (params: any) => {
    setKardexLoading(true);
    try {
      const res = await branchInventoryService.consultarKardex(params);
      setKardexMovimientos(res.items);
    } catch {
      setKardexMovimientos([]);
    } finally {
      setKardexLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Tarjetas KPI de Estado de Stock */}
      <InventoryKpiCards
        resumen={resumen}
        selectedNivel={filtros.nivelStock}
        onSelectNivel={handleSelectNivel}
        isLoading={isLoading}
      />

      {/* 2. Barra de Búsqueda, Filtros y Acciones */}
      <div className="vidrio rounded-2xl p-4">
        <ProductsFilterBar
          textoInicial={filtros.texto}
          categoriaIdInicial={filtros.categoriaId}
          estadoInicial={filtros.estado || 'activo'}
          categorias={categorias}
          onCambiarFiltros={handleCambiarFiltros}
          onCrearProducto={() => setCreateModalOpen(true)}
          onRegistrarEntrada={() => setEntryModalOpen(true)}
          onImportarCsv={() => setImportModalOpen(true)}
          onExportarCsv={handleExportarCsv}
          isExporting={isExporting}
        />
      </div>

      {/* 3. Tabla Principal de Productos */}
      <div className="vidrio rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <LoadingState rows={8} />
          </div>
        ) : productos.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No se encontraron productos"
              description="No hay artículos que coincidan con los criterios de búsqueda o el umbral seleccionado en esta sede."
              action={
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Registrar nuevo producto
                </button>
              }
            />
          </div>
        ) : (
          <div>
            <ProductsTable
              productos={productos}
              onSelectProducto={(p) => {
                setProductoSeleccionado(p);
                setDrawerOpen(true);
              }}
              onVerKardex={(p) => {
                setProductoSeleccionado(p);
                setKardexModalOpen(true);
              }}
              onEditarProducto={(p) => {
                setProductoSeleccionado(p);
                setEditModalOpen(true);
              }}
              onVerHistorialPrecios={(p) => {
                setProductoSeleccionado(p);
                setPriceHistoryModalOpen(true);
              }}
              onAjustarStockMinimo={(p) => {
                setProductoSeleccionado(p);
                setMinStockModalOpen(true);
              }}
              onCambiarEstado={(p, nuevoEstado) => cambiarEstado(p.id, nuevoEstado)}
            />

            {total > 0 && (
              <div className="p-4 border-t border-white/[0.08]">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Drawer Lateral de Detalle */}
      <ProductDrawer
        open={drawerOpen}
        producto={productoSeleccionado}
        sucursalId={sucursalId}
        onClose={() => setDrawerOpen(false)}
        onEditar={(p) => {
          setDrawerOpen(false);
          setProductoSeleccionado(p);
          setEditModalOpen(true);
        }}
        onVerKardex={(p) => {
          setDrawerOpen(false);
          setProductoSeleccionado(p);
          setKardexModalOpen(true);
        }}
        onVerHistorialPrecios={(p) => {
          setProductoSeleccionado(p);
          setPriceHistoryModalOpen(true);
        }}
        onAjustarStockMinimo={(p) => {
          setProductoSeleccionado(p);
          setMinStockModalOpen(true);
        }}
        onStockActualizado={recargar}
      />

      {/* 5. Modales Operativos */}
      <CreateProductModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onProductoCreado={recargar}
        sucursalId={sucursalId}
        categorias={categorias}
      />

      <EditProductModal
        isOpen={editModalOpen}
        producto={productoSeleccionado}
        categorias={categorias}
        proveedores={proveedores}
        onClose={() => setEditModalOpen(false)}
        onGuardar={editarProducto}
      />

      <RegisterStockEntryModal
        isOpen={entryModalOpen}
        sucursalId={sucursalId}
        productos={productos}
        proveedores={proveedores}
        productoInicial={productoSeleccionado}
        onClose={() => setEntryModalOpen(false)}
        onRegistrar={async (dto) => {
          try {
            await branchInventoryService.registrarEntrada(dto);
            await recargar();
            return { ok: true };
          } catch (err: any) {
            return { ok: false, error: err?.message };
          }
        }}
      />

      <PriceHistoryModal
        open={priceHistoryModalOpen}
        producto={productoSeleccionado}
        onClose={() => setPriceHistoryModalOpen(false)}
      />

      <ImportProductsModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportacionCompletada={recargar}
      />

      <AdjustMinStockModal
        open={minStockModalOpen}
        producto={productoSeleccionado}
        onClose={() => setMinStockModalOpen(false)}
        onGuardado={recargar}
      />

      <BranchKardexModal
        isOpen={kardexModalOpen}
        sucursalId={sucursalId}
        sucursalNombre={sucursalNombre}
        productos={productos}
        productoInicial={productoSeleccionado}
        onClose={() => setKardexModalOpen(false)}
        onConsultarKardex={handleConsultarKardexRapido}
        onExportarCsv={async (filtrosKardex) => {
          const blob = await branchInventoryService.descargarKardexCsv(filtrosKardex);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `kardex_${sucursalId}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        }}
        isLoading={kardexLoading}
        movimientos={kardexMovimientos}
      />
    </div>
  );
}

export default function AdminSucursalInventarioProductosPage() {
  return (
    <Suspense
      fallback={
        <div className="vidrio rounded-2xl p-6">
          <LoadingState rows={6} />
        </div>
      }
    >
      <InventarioProductosContenido />
    </Suspense>
  );
}
