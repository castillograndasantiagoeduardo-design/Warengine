'use client';

/**
 * StockCountAuditModal.tsx — Modal para ajuste de inventario por conteo físico directo (RF-ADM-B17).
 * Migrado a Modal.tsx para accesibilidad y diseño unificado.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import type {
  ProductoInventarioSede,
  AjustarInventarioDTO,
} from '../types/branch-inventory.types';

interface StockCountAuditModalProps {
  isOpen: boolean;
  sucursalId: number;
  productos: ProductoInventarioSede[];
  productoInicial?: ProductoInventarioSede | null;
  onClose: () => void;
  onAjustar: (dto: AjustarInventarioDTO) => Promise<{ ok: boolean; error?: string; data?: any }>;
}

export function StockCountAuditModal({
  isOpen,
  sucursalId,
  productos,
  productoInicial,
  onClose,
  onAjustar,
}: StockCountAuditModalProps) {
  const [productoId, setProductoId] = useState('');
  const [stockFisico, setStockFisico] = useState<number | ''>('');
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (productoInicial) {
        setProductoId(productoInicial.id);
        setStockFisico(productoInicial.stockActual);
      } else if (productos.length > 0) {
        setProductoId(productos[0].id);
        setStockFisico(productos[0].stockActual);
      }
      setMotivo('');
      setErrorMsg(null);
    }
  }, [isOpen, productoInicial, productos]);

  const productoSeleccionado = productos.find((p) => p.id === productoId);
  const stockSistema = productoSeleccionado?.stockActual ?? 0;
  const fisicoNum = typeof stockFisico === 'number' ? stockFisico : stockSistema;
  const diferencia = fisicoNum - stockSistema;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!productoId) {
      setErrorMsg('Debes seleccionar un producto.');
      return;
    }

    if (stockFisico === '' || stockFisico < 0) {
      setErrorMsg('El stock físico debe ser un número igual o mayor a cero.');
      return;
    }

    if (diferencia === 0) {
      setErrorMsg('El conteo físico coincide con el stock actual del sistema. No se requiere ajuste.');
      return;
    }

    if (!motivo.trim()) {
      setErrorMsg('Debes justificar el motivo de la discrepancia encontrada.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onAjustar({
        sucursalId,
        productoId,
        stockFisico: Number(stockFisico),
        motivo: motivo.trim(),
      });

      if (res.ok) {
        onClose();
      } else {
        setErrorMsg(res.error || 'No fue posible asentar el ajuste.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al asentar ajuste.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Auditoría y Ajuste de Inventario"
      description="Calibración del stock lógico según recuento físico en bodega"
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
            disabled={isSubmitting || stockFisico === '' || diferencia === 0}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-40 shadow-lg shadow-rose-500/20"
          >
            {isSubmitting ? 'Ajustando...' : 'Aplicar Ajuste'}
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
            Producto a auditar *
          </label>
          <select
            value={productoId}
            onChange={(e) => {
              const pid = e.target.value;
              setProductoId(pid);
              const p = productos.find((item) => item.id === pid);
              if (p) setStockFisico(p.stockActual);
            }}
            className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
            required
          >
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.sku}) — Stock en sistema: {p.stockActual}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="vidrio rounded-xl p-3">
            <span className="text-[11px] text-white/40 block">Stock en sistema</span>
            <span className="text-xl font-bold font-mono text-white/70 mt-1 block">
              {stockSistema}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Conteo físico real *
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={stockFisico}
              onChange={(e) => setStockFisico(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/15 text-white font-mono text-base font-bold focus:outline-none focus:border-rose-500"
              required
            />
          </div>
        </div>

        {/* Resumen de Discrepancia */}
        <div className="vidrio rounded-xl p-3 flex items-center justify-between text-xs">
          <span className="text-white/60">Discrepancia detectada:</span>
          <span
            className={`font-mono font-bold text-sm ${
              diferencia > 0
                ? 'text-emerald-400'
                : diferencia < 0
                ? 'text-red-400'
                : 'text-white/40'
            }`}
          >
            {diferencia > 0 ? `+${diferencia} (Sobrante)` : diferencia < 0 ? `${diferencia} (Faltante)` : 'Sin discrepancia'}
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1">
            Justificación del ajuste *
          </label>
          <input
            type="text"
            placeholder="Ej. Conteo cíclico semanal de pasillo 3"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
            required
          />
        </div>
      </form>
    </Modal>
  );
}
