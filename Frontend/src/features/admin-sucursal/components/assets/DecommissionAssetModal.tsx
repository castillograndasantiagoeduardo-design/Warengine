'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { ActivoSede } from '../../types/branch-assets.types';

interface DecommissionAssetModalProps {
  activo: ActivoSede | null;
  onClose: () => void;
  onConfirm: (id: string, motivo: string) => Promise<any>;
}

export function DecommissionAssetModal({
  activo,
  onClose,
  onConfirm,
}: DecommissionAssetModalProps) {
  const [motivo, setMotivo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activo) {
      setMotivo('');
      setError(null);
    }
  }, [activo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activo) return;
    if (motivo.trim().length < 10) {
      setError('Debes especificar un motivo detallado de al menos 10 caracteres.');
      return;
    }

    setProcesando(true);
    setError(null);
    try {
      await onConfirm(activo.id, motivo.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al procesar la baja del activo.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Modal
      open={Boolean(activo)}
      onClose={onClose}
      title="Dar de Baja Activo"
      description={`¿Confirmas la baja definitiva del activo ${activo?.codigoActivo} (${activo?.nombre})?`}
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
            disabled={procesando || motivo.trim().length < 10}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-all shadow-sm"
          >
            {procesando ? 'Procesando...' : 'Confirmar baja'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-1">
          <p className="font-semibold">Atención: Acción irreversible</p>
          <p className="text-rose-300/80">
            Al dar de baja un activo, éste pasa a estado inactivo y no podrá volver a asignarse ni entrar en mantenimiento técnico.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            Motivo o justificación de la baja *
          </label>
          <textarea
            required
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej. Obsolescencia técnica irreparable constatada en revisión pericial..."
            className="w-full px-3 py-2 bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500/40 resize-none"
          />
          <div className="flex justify-between items-center text-[11px] text-neutral-500 mt-1">
            <span>Mínimo 10 caracteres</span>
            <span>{motivo.length} / 500</span>
          </div>
        </div>
      </form>
    </Modal>
  );
}
