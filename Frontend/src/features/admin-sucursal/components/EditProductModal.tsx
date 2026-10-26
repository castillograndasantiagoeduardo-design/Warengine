'use client';

/**
 * EditProductModal.tsx — Modal para edición de productos y umbrales de stock en sede.
 * 
 * Principio SOLID: Single Responsibility Principle (SRP).
 * Encapsula la mutación de datos comerciales, márgenes calculados reactivamente
 * y fijación del umbral de stock mínimo (RF-ADM-B2, RF-ADM-B11).
 */

import React, { useState, useEffect } from 'react';
import { Button3D } from '@/components/ui/Button3D';
import type {
  ProductoInventarioSede,
  CategoriaInventario,
  ProveedorInventario,
  ActualizarProductoDTO,
} from '../types/branch-inventory.types';

interface EditProductModalProps {
  isOpen: boolean;
  producto: ProductoInventarioSede | null;
  categorias: CategoriaInventario[];
  proveedores: ProveedorInventario[];
  onClose: () => void;
  onGuardar: (productoId: string, data: ActualizarProductoDTO) => Promise<{ ok: boolean; error?: string }>;
  onAbrirNuevoProveedor: () => void;
  onAbrirNuevaCategoria?: () => void;
  categoriaPreseleccionadaId?: number | null;
}

export function EditProductModal({
  isOpen,
  producto,
  categorias,
  proveedores,
  onClose,
  onGuardar,
  onAbrirNuevoProveedor,
  onAbrirNuevaCategoria,
  categoriaPreseleccionadaId,
}: EditProductModalProps) {
  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | ''>('');
  const [proveedorId, setProveedorId] = useState<number | ''>('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [stockMinimoSede, setStockMinimoSede] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (producto) {
      setSku(producto.sku || '');
      setNombre(producto.nombre || '');
      setCategoriaId(producto.categoriaId ?? '');
      setProveedorId(producto.proveedorId ?? '');
      setPrecioCompra(producto.precioCompra ? producto.precioCompra.toString() : '');
      setPrecioVenta(producto.precioVenta ? producto.precioVenta.toString() : '');
      setStockMinimoSede(producto.stockMinimo !== undefined ? producto.stockMinimo.toString() : '5');
      setIsActive(producto.isActive);
      setErrorMsg(null);
    }
  }, [producto]);

  useEffect(() => {
    if (categoriaPreseleccionadaId) {
      setCategoriaId(categoriaPreseleccionadaId);
    }
  }, [categoriaPreseleccionadaId]);

  if (!isOpen || !producto) return null;

  // Cálculo reactivo de margen de ganancia
  const pCompraNum = Number(precioCompra) || 0;
  const pVentaNum = Number(precioVenta) || 0;
  const margenPorcentaje =
    pCompraNum > 0
      ? Number((((pVentaNum - pCompraNum) / pCompraNum) * 100).toFixed(1))
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!sku.trim() || !nombre.trim()) {
      setErrorMsg('El SKU y el nombre son obligatorios.');
      return;
    }

    if (pVentaNum <= 0) {
      setErrorMsg('El precio de venta debe ser mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onGuardar(producto.id, {
        sku: sku.trim().toUpperCase(),
        nombre: nombre.trim(),
        categoriaId: categoriaId !== '' ? Number(categoriaId) : null,
        proveedorId: proveedorId !== '' ? Number(proveedorId) : null,
        precioCompra: pCompraNum,
        precioVenta: pVentaNum,
        stockMinimoSede: stockMinimoSede !== '' ? Number(stockMinimoSede) : 0,
        isActive,
      });

      if (res.ok) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Error al guardar los cambios del producto.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al guardar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#0d1630] border border-white/[0.12] p-6 shadow-2xl text-slate-100 font-[family-name:var(--font-archivo)]">
        {/* Luz difusa superior dorada */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#e3b341]/40 to-transparent" />

        {/* Encabezado */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-[family-name:var(--font-anton)] uppercase tracking-wider">
                Editar Producto
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 font-mono">
                {producto.sku}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Modificar datos maestros y umbral de alerta en la sede
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer text-lg"
          >
            &times;
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Fila 1: SKU y Nombre */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Código SKU *
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-white focus:outline-none focus:border-[#e3b341]/60 font-mono text-xs uppercase"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-white focus:outline-none focus:border-[#e3b341]/60 text-xs"
                required
              />
            </div>
          </div>

          {/* Fila 2: Categoría y Proveedor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Categoría
                </label>
                {onAbrirNuevaCategoria && (
                  <button
                    type="button"
                    onClick={onAbrirNuevaCategoria}
                    className="text-[10px] text-[#e3b341] hover:underline font-medium cursor-pointer"
                  >
                    + Nueva
                  </button>
                )}
              </div>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value ? Number(e.target.value) : '')}
                className="w-full h-9 px-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-white focus:outline-none focus:border-[#e3b341]/60 text-xs cursor-pointer"
              >
                <option value="">Sin categoría asignada</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Proveedor
                </label>
                <button
                  type="button"
                  onClick={onAbrirNuevoProveedor}
                  className="text-[10px] text-[#e3b341] hover:underline font-medium cursor-pointer"
                >
                  + Nuevo
                </button>
              </div>
              <select
                value={proveedorId}
                onChange={(e) => setProveedorId(e.target.value ? Number(e.target.value) : '')}
                className="w-full h-9 px-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-white focus:outline-none focus:border-[#e3b341]/60 text-xs cursor-pointer"
              >
                <option value="">Sin proveedor asignado</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 3: Precios y Margen Dinámico */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Precio Compra (COP)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={precioCompra}
                onChange={(e) => setPrecioCompra(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-white focus:outline-none focus:border-[#e3b341]/60 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Precio Venta (COP) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-white focus:outline-none focus:border-[#e3b341]/60 font-mono text-xs"
                required
              />
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 block mb-1">
                Margen Comercial:
              </span>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-xs font-semibold ${
                  margenPorcentaje > 0
                    ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30'
                    : margenPorcentaje < 0
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                    : 'bg-white/[0.06] text-slate-300'
                }`}
              >
                <span>{margenPorcentaje >= 0 ? `+${margenPorcentaje}%` : `${margenPorcentaje}%`}</span>
              </div>
            </div>
          </div>

          {/* Fila 4: Umbral Stock Mínimo y Estado Activo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Stock Mínimo en esta Sede *
              </label>
              <input
                type="number"
                min="0"
                value={stockMinimoSede}
                onChange={(e) => setStockMinimoSede(e.target.value)}
                placeholder="5"
                className="w-full h-9 px-3 rounded-xl bg-[#09132b]/80 border border-white/[0.08] text-white focus:outline-none focus:border-[#e3b341]/60 font-mono text-xs"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Dispara alerta de abastecimiento al alcanzar este límite
              </span>
            </div>

            <div className="flex flex-col justify-center">
              <label className="block text-[11px] font-semibold text-slate-300 mb-2">
                Estado del Producto
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isActive ? 'bg-[#10b981]' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs text-slate-300">
                  {isActive ? 'Activo para venta' : 'Inactivo / Oculto en ventas'}
                </span>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2.5 px-4 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-xs font-[family-name:var(--font-ui)] uppercase cursor-pointer"
            >
              Cancelar
            </button>

            <Button3D
              type="submit"
              size="md"
              disabled={isSubmitting}
              className="font-bold min-w-[140px] justify-center"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button3D>
          </div>
        </form>
      </div>
    </div>
  );
}
