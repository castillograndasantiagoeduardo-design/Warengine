'use client';

/**
 * BranchInventoryView.tsx — Vista principal de catálogo, inventario y umbrales de sede.
 * 
 * Principios SOLID:
 * - Single Responsibility (SRP): Coordina la presentación del catálogo de la sede activa.
 * - Dependency Inversion (DIP): Los datos y mutaciones se orquestan mediante useBranchInventory.
 * 
 * Estándar visual: Fiel a warengine-ui/SKILL.md, estética Midnight Navy, acentos dorados
 * y espaciado tabular sin datos quemados ni mocks genéricos.
 */

import React, { useState } from 'react';
import { useBranchInventory } from '../hooks/useBranchInventory';
import { useInventoryMovements } from '../hooks/useInventoryMovements';
import { GlassCard } from './GlassCard';
import { Button3D } from '@/components/ui/Button3D';
import { EditProductModal } from './EditProductModal';
import { CreateSupplierModal } from './CreateSupplierModal';
import { CreateProductModal } from './CreateProductModal';
import { RegisterStockEntryModal } from './RegisterStockEntryModal';
import { ManualExitModal } from './ManualExitModal';
import { StockCountAuditModal } from './StockCountAuditModal';
import {
  SearchIcon,
  PlusIcon,
  RefreshCwIcon,
  EditIcon,
  PackageIcon,
  TruckIcon,
  CopyIcon,
  CheckIcon,
  MinusIcon,
  ScaleIcon,
} from './Icons';
import type { ProductoInventarioSede } from '../types/branch-inventory.types';

interface BranchInventoryViewProps {
  sucursalId: number;
  sucursalNombre?: string;
  className?: string;
}

export function BranchInventoryView({
  sucursalId,
  sucursalNombre,
  className = '',
}: BranchInventoryViewProps) {
  const {
    productos,
    total,
    categorias,
    proveedores,
    isLoading,
    isMutating,
    error,
    filtros,
    actualizarFiltros,
    recargar,
    editarProducto,
    cambiarEstado,
    crearProveedor,
  } = useBranchInventory({ sucursalId });

  // Hook de movimientos operativos y trazabilidad Kardex (Fase 2)
  const {
    registrarEntrada,
    registrarSalida,
    ajustarInventario,
    consultarKardex,
    exportarCsv,
    isKardexLoading,
    kardexData,
  } = useInventoryMovements();

  // Modales
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoInventarioSede | null>(null);
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  // Modales Operativos Fase 2
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [productoMovimiento, setProductoMovimiento] = useState<ProductoInventarioSede | null>(null);

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);

  const handleCopySku = (sku: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 1500);
  };

  const handleAbrirEdicion = (p: ProductoInventarioSede) => {
    setProductoSeleccionado(p);
    setIsEditModalOpen(true);
  };

  const handleAbrirEntrada = (p?: ProductoInventarioSede) => {
    setProductoMovimiento(p || null);
    setIsEntryModalOpen(true);
  };

  const handleAbrirSalida = (p: ProductoInventarioSede) => {
    setProductoMovimiento(p);
    setIsExitModalOpen(true);
  };

  const handleAbrirAjuste = (p?: ProductoInventarioSede) => {
    setProductoMovimiento(p || null);
    setIsAuditModalOpen(true);
  };

  // Contadores para chips de filtrado
  const countOptimo = productos.filter((p) => p.estadoStock === 'optimo').length;
  const countBajo = productos.filter((p) => p.estadoStock === 'bajo' || p.estadoStock === 'critico').length;
  const countAgotado = productos.filter((p) => p.estadoStock === 'agotado').length;

  return (
    <div className={`space-y-5 animate-in fade-in duration-300 ${className}`}>
      {/* 1. Encabezado de la Sección con Acciones Principales */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/[0.04]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-[family-name:var(--font-anton)] tracking-wider text-white uppercase">
              Inventario & Stock de Sede
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-[#e3b341]/10 text-[#e3b341] border border-[#e3b341]/25 font-[family-name:var(--font-pixelify)]">
              {sucursalNombre}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-[family-name:var(--font-archivo)] mt-0.5">
            Control directo de catálogo, precios comerciales y umbrales de abastecimiento.
          </p>
        </div>

        {/* Acciones Rápidas de Almacén */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => recargar()}
            title="Refrescar catálogo"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <RefreshCwIcon size={15} className={isLoading ? 'animate-spin text-[#e3b341]' : ''} />
          </button>

          {/* Botón Asentar Entrada */}
          <button
            onClick={() => handleAbrirEntrada()}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 text-xs font-semibold text-[#10b981] hover:bg-[#10b981]/20 transition-colors cursor-pointer font-[family-name:var(--font-archivo)]"
          >
            <PlusIcon size={14} />
            <span>+ Entrada</span>
          </button>

          {/* Botón Ajuste por Conteo Físico */}
          <button
            onClick={() => handleAbrirAjuste()}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer font-[family-name:var(--font-archivo)]"
          >
            <ScaleIcon size={14} className="text-[#e3b341]" />
            <span>Ajuste Físico</span>
          </button>

          {/* Botón Nuevo Producto */}
          <Button3D
            size="sm"
            onClick={() => setIsCreateProductOpen(true)}
            className="font-bold font-[family-name:var(--font-pixelify)] tracking-wide uppercase text-xs h-9"
          >
            <PlusIcon size={14} className="mr-1" />
            <span>Nuevo Producto</span>
          </Button3D>
        </div>
      </div>

      {/* 2. Barra Superior de Filtros y Búsqueda */}
      <GlassCard padding="md" className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Buscador de Texto */}
          <div className="md:col-span-5 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <SearchIcon size={15} />
            </span>
            <input
              type="text"
              placeholder="Buscar por SKU o nombre del producto..."
              value={filtros.texto || ''}
              onChange={(e) => actualizarFiltros({ texto: e.target.value })}
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:border-[#e3b341]/60 text-xs font-[family-name:var(--font-archivo)]"
            />
          </div>

          {/* Filtro por Categoría */}
          <div className="md:col-span-4">
            <select
              value={filtros.categoriaId || ''}
              onChange={(e) =>
                actualizarFiltros({
                  categoriaId: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full h-10 px-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-slate-300 focus:outline-none focus:border-[#e3b341]/60 text-xs font-[family-name:var(--font-archivo)] cursor-pointer"
            >
              <option value="">Todas las categorías ({categorias.length})</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Estado (Activos / Inactivos) */}
          <div className="md:col-span-3">
            <select
              value={filtros.isActive === undefined ? '' : filtros.isActive ? '1' : '0'}
              onChange={(e) =>
                actualizarFiltros({
                  isActive:
                    e.target.value === ''
                      ? undefined
                      : e.target.value === '1',
                })
              }
              className="w-full h-10 px-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-slate-300 focus:outline-none focus:border-[#e3b341]/60 text-xs font-[family-name:var(--font-archivo)] cursor-pointer"
            >
              <option value="">Todos los estados</option>
              <option value="1">Solo productos activos</option>
              <option value="0">Solo productos inactivos</option>
            </select>
          </div>
        </div>

        {/* Chips de Filtrado Rápido por Nivel de Stock */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.04] text-xs">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 font-[family-name:var(--font-archivo)]">
            Nivel de existencias:
          </span>

          <button
            onClick={() => actualizarFiltros({ nivelStock: 'todos' })}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filtros.nivelStock === 'todos' || !filtros.nivelStock
                ? 'bg-[#e3b341]/20 text-[#e3b341] border border-[#e3b341]/40 font-semibold'
                : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            Todos ({total})
          </button>

          <button
            onClick={() => actualizarFiltros({ nivelStock: 'optimo' })}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              filtros.nivelStock === 'optimo'
                ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 font-semibold'
                : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            <span>Óptimo ({countOptimo})</span>
          </button>

          <button
            onClick={() => actualizarFiltros({ nivelStock: 'bajo' })}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              filtros.nivelStock === 'bajo'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold'
                : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span>Stock Bajo ({countBajo})</span>
          </button>

          <button
            onClick={() => actualizarFiltros({ nivelStock: 'agotado' })}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              filtros.nivelStock === 'agotado'
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 font-semibold'
                : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            <span>Agotados ({countAgotado})</span>
          </button>
        </div>
      </GlassCard>

      {/* 3. Error Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => recargar()}
            className="text-xs underline text-red-200 hover:text-white font-semibold cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* 4. Tabla de Catálogo y Existencias de Sede */}
      <GlassCard padding="none" className="overflow-hidden">
        {isLoading && productos.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="inline-block animate-spin text-[#e3b341]">
              <RefreshCwIcon size={24} />
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Cargando existencias reales de la sucursal...
            </p>
          </div>
        ) : productos.length === 0 ? (
          /* Estado Vacío Verídico (Sin Fake Mock Data) */
          <div className="p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-400">
              <PackageIcon size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-[family-name:var(--font-anton)] uppercase tracking-wide">
                No hay productos en esta vista
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed font-[family-name:var(--font-archivo)]">
                {filtros.texto || filtros.categoriaId || filtros.nivelStock !== 'todos'
                  ? 'Ningún artículo coincide con los filtros aplicados. Prueba restableciendo los criterios.'
                  : 'Aún no se han registrado productos en el catálogo de esta sede. Puedes dar de alta el primero ahora.'}
              </p>
            </div>
            <div className="pt-2">
              <Button3D
                size="sm"
                onClick={() => setIsCreateProductOpen(true)}
                className="font-bold uppercase text-xs"
              >
                + Registrar Primer Producto
              </Button3D>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-[family-name:var(--font-pixelify)]">
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Producto & Categoría</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4 text-center">Stock en Sede</th>
                  <th className="py-3 px-4 text-center">Umbral Mínimo</th>
                  <th className="py-3 px-4 text-right">Precio Compra</th>
                  <th className="py-3 px-4 text-right">Precio Venta</th>
                  <th className="py-3 px-4 text-center">Margen</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center min-w-[140px]">Operaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {productos.map((prod) => {
                  const isAgotado = prod.estadoStock === 'agotado' || prod.stockActual <= 0;
                  const isBajo = prod.estadoStock === 'bajo' || (prod.stockActual > 0 && prod.stockActual <= prod.stockMinimo);

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-white/[0.02] transition-colors font-[family-name:var(--font-archivo)]"
                    >
                      {/* SKU */}
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-200">{prod.sku}</span>
                          <button
                            onClick={(e) => handleCopySku(prod.sku, e)}
                            title="Copiar SKU"
                            className="p-1 rounded text-slate-500 hover:text-[#e3b341] transition-colors cursor-pointer"
                          >
                            {copiedSku === prod.sku ? (
                              <CheckIcon size={12} className="text-[#10b981]" />
                            ) : (
                              <CopyIcon size={12} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Producto & Categoría */}
                      <td className="py-3 px-4 max-w-[240px]">
                        <p className="font-semibold text-white truncate" title={prod.nombre}>
                          {prod.nombre}
                        </p>
                        <span className="inline-block text-[10px] text-slate-400 mt-0.5 font-sans">
                          {prod.categoriaNombre || 'Sin categoría'}
                        </span>
                      </td>

                      {/* Proveedor */}
                      <td className="py-3 px-4 text-slate-400 text-[11px] truncate max-w-[160px]">
                        {prod.proveedorNombre || (
                          <span className="text-slate-600 italic">Sin proveedor</span>
                        )}
                      </td>

                      {/* Stock en Sede */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-semibold ${
                            isAgotado
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                              : isBajo
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isAgotado
                                ? 'bg-red-400'
                                : isBajo
                                ? 'bg-amber-400 animate-pulse'
                                : 'bg-[#10b981]'
                            }`}
                          />
                          <span>{prod.stockActual} unid.</span>
                        </span>
                      </td>

                      {/* Umbral Mínimo */}
                      <td className="py-3 px-4 text-center font-mono text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                          {prod.stockMinimo} unid.
                        </span>
                      </td>

                      {/* Precio Compra */}
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {formatCOP(prod.precioCompra)}
                      </td>

                      {/* Precio Venta */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-white">
                        {formatCOP(prod.precioVenta)}
                      </td>

                      {/* Margen */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                            prod.margenGananciaPorcentaje > 0
                              ? 'text-[#10b981]'
                              : prod.margenGananciaPorcentaje < 0
                              ? 'text-red-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {prod.margenGananciaPorcentaje > 0
                            ? `+${prod.margenGananciaPorcentaje}%`
                            : `${prod.margenGananciaPorcentaje}%`}
                        </span>
                      </td>

                      {/* Switch Estado */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => cambiarEstado(prod.id, !prod.isActive)}
                          title={prod.isActive ? 'Desactivar producto' : 'Activar producto'}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            prod.isActive ? 'bg-[#10b981]' : 'bg-slate-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              prod.isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Operaciones y Acciones Rápidas */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Entrada rápida */}
                          <button
                            onClick={() => handleAbrirEntrada(prod)}
                            title="Registrar entrada de mercancía"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#10b981] hover:bg-[#10b981]/15 transition-colors cursor-pointer"
                          >
                            <PlusIcon size={14} />
                          </button>

                          {/* Salida manual */}
                          <button
                            onClick={() => handleAbrirSalida(prod)}
                            title="Registrar salida / merma"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/15 transition-colors cursor-pointer"
                          >
                            <MinusIcon size={14} />
                          </button>

                          {/* Ajuste por conteo físico */}
                          <button
                            onClick={() => handleAbrirAjuste(prod)}
                            title="Ajuste por conteo físico"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#e3b341] hover:bg-[#e3b341]/15 transition-colors cursor-pointer"
                          >
                            <ScaleIcon size={14} />
                          </button>

                          {/* Editar producto */}
                          <button
                            onClick={() => handleAbrirEdicion(prod)}
                            title="Editar datos y umbral de stock mínimo"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                          >
                            <EditIcon size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* 5. Modales Funcionales Fase 1 */}
      <EditProductModal
        isOpen={isEditModalOpen}
        producto={productoSeleccionado}
        categorias={categorias}
        proveedores={proveedores}
        onClose={() => {
          setIsEditModalOpen(false);
          setProductoSeleccionado(null);
        }}
        onGuardar={editarProducto}
        onAbrirNuevoProveedor={() => setIsSupplierModalOpen(true)}
      />

      <CreateSupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onProveedorCreado={() => recargar()}
        crearProveedorFn={crearProveedor}
      />

      <CreateProductModal
        isOpen={isCreateProductOpen}
        onClose={() => setIsCreateProductOpen(false)}
        onProductoCreado={() => recargar()}
        sucursalId={sucursalId}
      />

      {/* 6. Modales Operativos Fase 2 (Entradas, Salidas, Ajustes, Kardex) */}
      <RegisterStockEntryModal
        isOpen={isEntryModalOpen}
        sucursalId={sucursalId}
        productos={productos}
        proveedores={proveedores}
        productoInicial={productoMovimiento}
        onClose={() => {
          setIsEntryModalOpen(false);
          setProductoMovimiento(null);
        }}
        onRegistrar={async (dto) => {
          const res = await registrarEntrada(dto);
          if (res.ok) recargar();
          return res;
        }}
      />

      <ManualExitModal
        isOpen={isExitModalOpen}
        sucursalId={sucursalId}
        productos={productos}
        productoInicial={productoMovimiento}
        onClose={() => {
          setIsExitModalOpen(false);
          setProductoMovimiento(null);
        }}
        onRegistrar={async (dto) => {
          const res = await registrarSalida(dto);
          if (res.ok) recargar();
          return res;
        }}
      />

      <StockCountAuditModal
        isOpen={isAuditModalOpen}
        sucursalId={sucursalId}
        productos={productos}
        productoInicial={productoMovimiento}
        onClose={() => {
          setIsAuditModalOpen(false);
          setProductoMovimiento(null);
        }}
        onAjustar={async (dto) => {
          const res = await ajustarInventario(dto);
          if (res.ok) recargar();
          return res;
        }}
      />
    </div>
  );
}
