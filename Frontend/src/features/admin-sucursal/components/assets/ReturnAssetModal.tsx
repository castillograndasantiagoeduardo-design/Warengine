'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { ActivoSede } from '../../types/branch-assets.types';

interface ReturnAssetModalProps {
  activo: ActivoSede | null;
  onClose: () => void;
  onConfirm: (id: string, observaciones?: string | null) => Promise<any>;
}

export function ReturnAssetModal({
  activo,
  onClose,
  onConfirm,
}: ReturnAssetModalProps) {
  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activo) {
      setObservaciones('');
      setError(null);
    }
  }, [activo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activo) return;

    setProcesando(true);
    setError(null);
    try {
      await onConfirm(activo.id, observaciones.trim() || null);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al registrar la devolución del activo.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Modal
      open={Boolean(activo)}
      onClose={onClose}
      title="Registrar Devolución de Activo"
      description={`¿Confirmas la recepción del activo ${activo?.codigoActivo} (${activo?.nombre})?`}
      size="sm"
      locked={procesando}
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={procesando}
            className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={procesando}
            className="px-4 py-2 text-xs font-semibold text-neutral-900 bg-white hover:bg-neutral-200 active:scale-[0.98] rounded-xl transition-all shadow-sm"
          >
            {procesando ? 'Procesando...' : 'Confirmar devolución'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        {activo?.custodioActual && (
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-neutral-300 space-y-1">
            <div className="text-neutral-400">Custodio actual:</div>
            <div className="font-semibold text-neutral-100">
              {activo.custodioActual.nombre}
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            Observaciones o estado de entrega
          </label>
          <textarea
            rows={3}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej. Entregado en perfecto estado funcional con todos sus accesorios..."
            className="w-full px-3 py-2 bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-white/30 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}
