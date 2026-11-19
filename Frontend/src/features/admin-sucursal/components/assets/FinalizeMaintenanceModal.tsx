'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { FinalizarMantenimientoDTO, MantenimientoSede } from '../../types/branch-assets.types';

interface FinalizeMaintenanceModalProps {
  mantenimiento: MantenimientoSede | null;
  onClose: () => void;
  onConfirm: (id: string, datos: FinalizarMantenimientoDTO) => Promise<any>;
}

export function FinalizeMaintenanceModal({
  mantenimiento,
  onClose,
  onConfirm,
}: FinalizeMaintenanceModalProps) {
  const [fechaFin, setFechaFin] = useState('');
  const [costo, setCosto] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mantenimiento) return;
    setFechaFin(new Date().toISOString().split('T')[0]);
    setCosto(mantenimiento.costo !== null && mantenimiento.costo !== undefined ? String(mantenimiento.costo) : '');
    setDescripcion(mantenimiento.descripcion || '');
    setError(null);
  }, [mantenimiento]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mantenimiento) return;
    if (!fechaFin) {
      setError('La fecha de finalización es requerida.');
      return;
    }

    setProcesando(true);
    setError(null);
    try {
      const costoNum = costo.trim() !== '' ? Number(costo) : null;
      await onConfirm(mantenimiento.id, {
        fechaFin,
        costo: costoNum,
        descripcion: descripcion.trim() || null,
      });
      onClose();
    } catch (err: any) {
      const msg = err?.issues?.[0]?.message || err?.message || 'Error al finalizar el mantenimiento.';
      setError(msg);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Modal
      open={Boolean(mantenimiento)}
      onClose={onClose}
      title="Finalizar Mantenimiento Técnico"
      description={`Cierra el servicio técnico del activo ${mantenimiento?.activoCodigo} y devuelve el equipo a estado disponible.`}
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
            {procesando ? 'Guardando...' : 'Completar y liberar activo'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs space-y-1">
          <div className="text-neutral-400">Activo intervenido:</div>
          <div className="font-semibold text-neutral-100 flex items-center gap-2">
            <span>{mantenimiento?.activoNombre}</span>
            <span className="font-mono text-neutral-400">({mantenimiento?.activoCodigo})</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Iniciado el: <span className="font-mono text-neutral-300">{mantenimiento?.fecha}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Fecha de cierre *
            </label>
            <input
              type="date"
              required
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 font-mono bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-200 focus:outline-none focus:border-white/30 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Costo final real (COP)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 font-mono bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-white/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            Notas de cierre o conformidad
          </label>
          <textarea
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej. Equipo probado con carga y entregado con acta de conformidad..."
            className="w-full px-3 py-2 bg-neutral-900/60 border border-white/10 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-white/30 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}
