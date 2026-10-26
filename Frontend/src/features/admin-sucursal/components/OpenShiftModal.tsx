'use client';

/**
 * OpenShiftModal.tsx — Modal para apertura de turno de caja con fondo inicial (RF-FMC-A1).
 * 
 * Principio SOLID: Single Responsibility Principle (SRP).
 */

import React, { useState } from 'react';
import { Button3D } from '@/components/ui/Button3D';
import { DollarSignIcon } from './Icons';

interface OpenShiftModalProps {
  isOpen: boolean;
  sucursalNombre: string;
  onClose: () => void;
  onAbrir: (fondoInicial: number) => Promise<{ ok: boolean; error?: string }>;
}

export function OpenShiftModal({
  isOpen,
  sucursalNombre,
  onClose,
  onAbrir,
}: OpenShiftModalProps) {
  const [fondoInicial, setFondoInicial] = useState<number | ''>(100000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (fondoInicial === '' || fondoInicial < 0) {
      setErrorMsg('El fondo inicial en efectivo no puede ser negativo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onAbrir(Number(fondoInicial));
      if (res.ok) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al abrir el turno de caja.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="
          relative w-full max-w-md overflow-hidden rounded-2xl
          bg-[#0d1630] border border-white/[0.12] shadow-2xl
          text-white font-[family-name:var(--font-archivo)]
        "
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#111d3f]/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
              <DollarSignIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold font-[family-name:var(--font-anton)] uppercase tracking-wide">
                Apertura de Turno de Caja
              </h2>
              <p className="text-xs text-slate-400">
                Punto de venta POS en {sucursalNombre} (RF-FMC-A1).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Fondo Inicial en Caja (Base de Efectivo) *
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              placeholder="Ej. 100000"
              value={fondoInicial}
              onChange={(e) => setFondoInicial(e.target.value !== '' ? Number(e.target.value) : '')}
              required
              className="w-full h-11 px-3 rounded-xl bg-[#09132b] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-[#e3b341] font-mono font-bold"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Valor configurado: {formatCOP(typeof fondoInicial === 'number' ? fondoInicial : 0)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-white">Operación Autorizada</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Al abrir el turno, se habilita el módulo de cobro en mostrador y facturación rápida para esta sede.
            </p>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs rounded-xl border border-white/20 text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <Button3D
              type="submit"
              size="sm"
              disabled={isSubmitting || fondoInicial === ''}
              className="font-bold uppercase text-xs"
            >
              {isSubmitting ? 'Iniciando Turno...' : 'Abrir Turno'}
            </Button3D>
          </div>
        </form>
      </div>
    </div>
  );
}
