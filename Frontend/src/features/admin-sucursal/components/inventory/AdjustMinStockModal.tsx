'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { branchInventoryService } from '../../api/branch-inventory.service';
import type { ProductoInventarioSede } from '../../types/branch-inventory.types';

interface AdjustMinStockModalProps {
  open: boolean;
  producto: ProductoInventarioSede | null;
  onClose: () => void;
  onGuardado: () => void;
}

export function AdjustMinStockModal({
  open,
  producto,
  onClose,
  onGuardado,
}: AdjustMinStockModalProps) {
  const [minimo, setMinimo] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open && producto) {
      setMinimo(String(producto.stockMinimo ?? 0));
      setErrorMsg(null);
    }
  }, [open, producto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!producto) return;

    const val = Number(minimo);
    if (isNaN(val) || val < 0) {
      setErrorMsg('El stock mínimo debe ser un número igual o superior a 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await branchInventoryService.ajustarStockMinimo(producto.id, val);
      if (res.ok) {
        onGuardado();
        onClose();
      } else {
        setErrorMsg(res.error || 'No fue posible actualizar el umbral de stock.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajustar stock mínimo"
      description={producto ? `${producto.nombre} (${producto.sku})` : undefined}
      size="sm"
      locked={isSubmitting}
      footer={
        <div className="flex gap-2 justify-end w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer shadow-lg shadow-rose-500/20"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar umbral'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1.5">
            Umbral de stock mínimo en esta sede
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={minimo}
            onChange={(e) => setMinimo(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-rose-500 transition-colors"
            required
            autoFocus
          />
          <p className="text-[11px] text-white/40 mt-1.5">
            Cuando las existencias de este producto en la sede caigan al nivel o por debajo de este valor, se marcará como &quot;Stock bajo&quot;.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}
      </form>
    </Modal>
  );
}
