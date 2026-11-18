'use client';

/**
 * RegisterStockEntryModal.tsx — Modal para recepción y asentamiento de mercancía en sede (RF-ADM-B7).
 * Migrado a Modal.tsx para accesibilidad y diseño unificado.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import type {
  ProductoInventarioSede,
  ProveedorInventario,
  RegistrarEntradaDTO,
} from '../types/branch-inventory.types';

interface RegisterStockEntryModalProps {
  isOpen: boolean;
  sucursalId: number;
  productos: ProductoInventarioSede[];
  proveedores: ProveedorInventario[];
  productoInicial?: ProductoInventarioSede | null;
  onClose: () => void;
  onRegistrar: (dto: RegistrarEntradaDTO) => Promise<{ ok: boolean; error?: string }>;
}

export function RegisterStockEntryModal({
  isOpen,
  sucursalId,
  productos,
  proveedores,
  productoInicial,
  onClose,
  onRegistrar,
}: RegisterStockEntryModalProps) {
  const [productoId, setProductoId] = useState('');
  const [proveedorId, setProveedorId] = useState<string>('');
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (productoInicial) {
        setProductoId(productoInicial.id);
        if (productoInicial.proveedorId) {
          setProveedorId(String(productoInicial.proveedorId));
        }
      } else if (productos.length > 0) {
        setProductoId(productos[0].id);
      }
      setCantidad('');
      setMotivo('');
      setErrorMsg(null);
    }
  }, [isOpen, productoInicial, productos]);

  const productoSeleccionado = productos.find((p) => p.id === productoId);
  const stockPrevio = productoSeleccionado?.stockActual ?? 0;
  const cantNum = typeof cantidad === 'number' ? cantidad : 0;
  const stockResultante = stockPrevio + cantNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!productoId) {
      setErrorMsg('Debes seleccionar un producto.');
      return;
    }

    if (!cantidad || cantidad <= 0) {
      setErrorMsg('La cantidad a ingresar debe ser mayor a cero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onRegistrar({
        sucursalId,
        productoId,
        cantidad: Number(cantidad),
        proveedorId: proveedorId ? Number(proveedorId) : undefined,
        motivo: motivo.trim() || undefined,
      });

      if (res.ok) {
        onClose();
      } else {
        setErrorMsg(res.error || 'No fue posible registrar la entrada.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al registrar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Registrar Entrada de Mercancía"
      description="Ingreso físico y formal de existencias a la sede"
      size="md"
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
            disabled={isSubmitting || !cantidad || cantidad <= 0}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-40 shadow-lg shadow-rose-500/20"
          >
            {isSubmitting ? 'Registrando...' : 'Confirmar e Ingresar'}
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

        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1">
            Producto *
          </label>
          <select
            value={productoId}
            onChange={(e) => setProductoId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
            required
          >
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.sku}) — Stock actual: {p.stockActual ?? 0}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Proveedor (Remisión / Compra)
            </label>
            <select
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="">Sin proveedor específico</option>
              {proveedores.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Cantidad a ingresar *
            </label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Ej. 50"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
              required
            />
          </div>
        </div>

        {/* Resumen de saldo calculado */}
        {productoSeleccionado && (
          <div className="vidrio rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-white/60">Saldo resultante en sede:</span>
            <div className="font-mono">
              <span className="text-white/50">{stockPrevio}</span>
              <span className="text-emerald-400 font-bold mx-1.5">+{cantNum}</span>
              <span className="text-white font-bold text-sm">➔ {stockResultante}</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1">
            Motivo / Factura de compra / Remisión
          </label>
          <input
            type="text"
            placeholder="Ej. Factura #FC-9842 del proveedor"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
          />
        </div>
      </form>
    </Modal>
  );
}
