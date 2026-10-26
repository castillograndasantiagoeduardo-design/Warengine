'use client';

/**
 * PosTurnoModal.tsx — Modal para apertura y arqueo/cierre de turnos de caja en el POS.
 */

import React, { useState } from 'react';
import type { TurnoCajaDto } from '../types/pos.types';

interface PosTurnoModalProps {
  isOpen: boolean;
  onClose: () => void;
  turno: TurnoCajaDto | null;
  onAbrirTurno: (fondoInicial: number) => Promise<TurnoCajaDto>;
  onCerrarTurno: (fondoFinal: number) => Promise<TurnoCajaDto>;
}

export function PosTurnoModal({
  isOpen,
  onClose,
  turno,
  onAbrirTurno,
  onCerrarTurno,
}: PosTurnoModalProps) {
  const estaAbierto = Boolean(turno && (turno.estaAbierto === true || turno.fechaCierre === null));

  // Estados locales
  const [fondoInicial, setFondoInicial] = useState<string>('50000');
  const [fondoFinal, setFondoFinal] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatoCOP = (monto: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(monto);

  const handleApertura = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(fondoInicial);
    if (isNaN(monto) || monto < 0) {
      setErrorLocal('El fondo inicial debe ser un número igual o mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorLocal(null);
    try {
      await onAbrirTurno(monto);
      onClose();
    } catch (err: any) {
      setErrorLocal(err?.message || 'Error al abrir el turno de caja.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCierre = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(fondoFinal);
    if (isNaN(monto) || monto < 0) {
      setErrorLocal('El fondo final en efectivo contado debe ser igual o mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorLocal(null);
    try {
      await onCerrarTurno(monto);
      onClose();
    } catch (err: any) {
      setErrorLocal(err?.message || 'Error al cerrar el turno de caja.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0f1b3d] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white text-lg cursor-pointer"
        >
          &times;
        </button>

        {!estaAbierto ? (
          /* ========================================================
             MODAL: APERTURA DE TURNO
             ======================================================== */
          <form onSubmit={handleApertura}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#e3b341]/20 border border-[#e3b341]/40 flex items-center justify-center text-[#e3b341] text-xl">
                🔑
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-anton)] text-[#e3b341] text-xl tracking-wide uppercase">
                  Apertura de Turno de Caja
                </h3>
                <p className="text-xs text-white/60">Declara el fondo inicial en efectivo para iniciar operaciones</p>
              </div>
            </div>

            {errorLocal && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {errorLocal}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold text-white/80 mb-2 uppercase tracking-wider font-[family-name:var(--font-pixelify)]">
                Fondo Inicial en Efectivo (COP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={fondoInicial}
                  onChange={(e) => setFondoInicial(e.target.value)}
                  placeholder="50000"
                  required
                  autoFocus
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#0a1124] border border-white/20 text-white font-[family-name:var(--font-anton)] text-2xl tracking-wider focus:outline-none focus:border-[#e3b341] transition-colors"
                />
              </div>

              {/* Atajos rápidos de billetes comunes */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[20000, 50000, 100000, 200000].map((valor) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setFondoInicial(String(valor))}
                    className="py-1.5 px-2 rounded-lg bg-[#14213D] hover:bg-[#1a2b50] border border-white/10 text-white/80 hover:text-[#e3b341] text-[11px] font-[family-name:var(--font-pixelify)] transition-colors cursor-pointer"
                  >
                    {formatoCOP(valor)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-1/3 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-xs font-[family-name:var(--font-pixelify)] uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 py-2.5 rounded-xl bg-[#e3b341] hover:bg-[#e9b949] text-black font-[family-name:var(--font-pixelify)] text-xs font-bold uppercase cursor-pointer shadow-[0_3px_0_#b88a1f] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Iniciando...' : 'Iniciar Turno de Caja'}
              </button>
            </div>
          </form>
        ) : (
          /* ========================================================
             MODAL: ARQUEO Y CIERRE DE TURNO
             ======================================================== */
          <form onSubmit={handleCierre}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-300 text-xl">
                🔒
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-anton)] text-white text-xl tracking-wide uppercase">
                  Arqueo y Cierre de Caja
                </h3>
                <p className="text-xs text-white/60">Cuenta el efectivo físico en gaveta y confirma el balance</p>
              </div>
            </div>

            {errorLocal && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {errorLocal}
              </div>
            )}

            {/* Ficha informativa del turno */}
            <div className="p-3 rounded-xl bg-[#0a1124] border border-white/10 mb-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-white/60">
                <span>Fondo Inicial Declarado:</span>
                <span className="text-white font-medium">{formatoCOP(turno?.fondoInicial || 0)}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Apertura del Turno:</span>
                <span className="text-white">
                  {turno?.fechaApertura
                    ? new Date(turno.fechaApertura).toLocaleTimeString('es-CO')
                    : '—'}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-white/80 mb-2 uppercase tracking-wider font-[family-name:var(--font-pixelify)]">
                Efectivo Físico Contado en Gaveta (COP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={fondoFinal}
                  onChange={(e) => setFondoFinal(e.target.value)}
                  placeholder="0"
                  required
                  autoFocus
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#0a1124] border border-white/20 text-white font-[family-name:var(--font-anton)] text-2xl tracking-wider focus:outline-none focus:border-red-400 transition-colors"
                />
              </div>
              <p className="text-[11px] text-white/50 mt-1">
                El sistema contrastará automáticamente este valor contra las ventas registradas.
              </p>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-1/3 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-xs font-[family-name:var(--font-pixelify)] uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-[family-name:var(--font-pixelify)] text-xs font-bold uppercase cursor-pointer shadow-[0_3px_0_#7f1d1d] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Cerrando...' : 'Confirmar Cierre de Caja'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
