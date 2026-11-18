'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { branchInventoryService } from '../../api/branch-inventory.service';
import type { EntradaMercanciaItem } from '../../types/branch-inventory.types';

interface VoidStockEntryModalProps {
  open: boolean;
  entrada: EntradaMercanciaItem | null;
  onClose: () => void;
  onAnulada: () => void;
}

export function VoidStockEntryModal({
  open,
  entrada,
  onClose,
  onAnulada,
}: VoidStockEntryModalProps) {
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClose = () => {
    setMotivo('');
    setErrorMsg(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entrada) return;

    const limpio = motivo.trim();
    if (limpio.length < 5) {
      setErrorMsg('Debes especificar un motivo de anulación de al menos 5 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await branchInventoryService.anularEntrada(entrada.id, limpio);
      handleClose();
      onAnulada();
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'No se pudo anular la entrada. Verifica que la sede cuente con existencias suficientes para revertir el stock.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Anular entrada de mercancía"
      description={entrada ? `Entrada #${entrada.id} · ${entrada.productoNombre}` : undefined}
      size="md"
      locked={isSubmitting}
      footer={
        <div className="flex gap-2 justify-end w-full">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || motivo.trim().length < 5}
            className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-40 shadow-lg shadow-red-500/20"
          >
            {isSubmitting ? 'Anulando...' : 'Confirmar anulación'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Advertencia Crítica */}
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-red-400">
            <span>⚠️</span> Acción irreversible
          </div>
          <p>
            Esta acción revertirá el stock ingresado ({entrada?.cantidad ?? 0} unidades) en el inventario de la sede. Si los productos ya fueron vendidos o descargados y no hay existencias disponibles para cubrir la reversión, el sistema rechazará la anulación.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1.5">
            Motivo de anulación * (mínimo 5 caracteres)
          </label>
          <textarea
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-red-500 transition-colors resize-none placeholder-white/30"
            placeholder="Ej. Factura del proveedor duplicada o ingresada por error..."
            required
            autoFocus
          />
          <p className="text-[11px] text-white/40 mt-1">
            {motivo.trim().length}/5 caracteres requeridos.
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
