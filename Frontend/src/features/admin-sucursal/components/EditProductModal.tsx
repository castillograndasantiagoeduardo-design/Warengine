'use client';

/**
 * EditProductModal.tsx — Modal para edición de productos y umbrales de stock en sede.
 * Migrado a Modal.tsx para accesibilidad y diseño unificado.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { formatCOP } from '@/lib/format/moneda';
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
  onAbrirNuevoProveedor?: () => void;
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
  const [precioCorporativo, setPrecioCorporativo] = useState('');
  const [stockMinimoSede, setStockMinimoSede] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && producto) {
      setSku(producto.sku || '');
      setNombre(producto.nombre || '');
      setCategoriaId(producto.categoriaId ?? '');
      setProveedorId(producto.proveedorId ?? '');
      setPrecioCompra(producto.precioCompra ? String(producto.precioCompra) : '');
      setPrecioVenta(String(producto.precioVenta ?? ''));
      setPrecioCorporativo(producto.precioCorporativo ? String(producto.precioCorporativo) : '');
      setStockMinimoSede(producto.stockMinimo !== undefined ? String(producto.stockMinimo) : '');
      setIsActive(producto.isActive ?? true);
      setErrorMsg(null);
    }
  }, [isOpen, producto]);

  useEffect(() => {
    if (categoriaPreseleccionadaId) {
      setCategoriaId(categoriaPreseleccionadaId);
    }
  }, [categoriaPreseleccionadaId]);

  if (!producto) return null;

  const compraNum = parseFloat(precioCompra) || 0;
  const ventaNum = parseFloat(precioVenta) || 0;
  const margen = ventaNum > 0 && compraNum > 0 ? (((ventaNum - compraNum) / ventaNum) * 100).toFixed(1) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const dto: ActualizarProductoDTO = {
      nombre: nombre.trim() || undefined,
      categoriaId: categoriaId === '' ? null : Number(categoriaId),
      proveedorId: proveedorId === '' ? null : Number(proveedorId),
      precioCompra: precioCompra ? parseFloat(precioCompra) : undefined,
      precioVenta: parseFloat(precioVenta),
      precioCorporativo: precioCorporativo ? parseFloat(precioCorporativo) : null,
      stockMinimoSede: stockMinimoSede !== '' ? parseInt(stockMinimoSede, 10) : undefined,
      isActive,
    };

    setIsSubmitting(true);
    try {
      const res = await onGuardar(producto.id, dto);
      if (res.ok) {
        onClose();
      } else {
        setErrorMsg(res.error || 'No fue posible guardar los cambios.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al guardar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Editar Producto"
      description={`Modificando ficha de ${producto.nombre} (${producto.sku})`}
      size="lg"
      locked={isSubmitting}
      footer={
        <div className="flex gap-2 justify-end w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-40 shadow-lg shadow-rose-500/20"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Código SKU (Inmutable)
            </label>
            <input
              type="text"
              value={sku}
              disabled
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white/50 font-mono text-xs cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Nombre comercial *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Precio Venta POS *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={precioVenta}
              onChange={(e) => setPrecioVenta(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Precio Compra
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={precioCompra}
              onChange={(e) => setPrecioCompra(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Precio B2B Corporativo
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={precioCorporativo}
              onChange={(e) => setPrecioCorporativo(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {margen !== null && (
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
            <span className="text-white/60">Margen comercial estimado:</span>
            <span className="font-mono font-bold text-emerald-400">{margen}%</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Categoría
            </label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value ? Number(e.target.value) : '')}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
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
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Proveedor asignado
            </label>
            <select
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value ? Number(e.target.value) : '')}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Stock Mínimo en Sede
            </label>
            <input
              type="number"
              min="0"
              value={stockMinimoSede}
              onChange={(e) => setStockMinimoSede(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Estado del producto
            </label>
            <div className="flex items-center gap-3 h-10">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isActive ? 'bg-emerald-500' : 'bg-white/20'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs text-white/70">
                {isActive ? 'Activo para venta y POS' : 'Inactivo / Oculto'}
              </span>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
