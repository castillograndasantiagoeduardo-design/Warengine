'use client';

/**
 * CloseShiftModal.tsx — Modal para cierre de turno y arqueo de caja (RF-FMC-A4).
 * 
 * Principio SOLID: Single Responsibility Principle (SRP).
 */

import React, { useState } from 'react';
import { Button3D } from '@/components/ui/Button3D';
import { DollarSignIcon, TriangleAlertIcon } from './Icons';
import type { TurnoCajaActivo } from '../types/branch-staff.types';

interface CloseShiftModalProps {
  isOpen: boolean;
  turno: TurnoCajaActivo | null;
  onClose: () => void;
  onCerrar: (fondoFinal: number) => Promise<{ ok: boolean; error?: string }>;
}

export function CloseShiftModal({
  isOpen,
  turno,
  onClose,
  onCerrar,
}: CloseShiftModalProps) {
  const [fondoFinal, setFondoFinal] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !turno) return null;

  const fondoInicial = turno.fondoInicial;
  const ventas = turno.totalVentas || 0;
  const esperadoEnCaja = fondoInicial + ventas;
  const finalNum = typeof fondoFinal === 'number' ? fondoFinal : 0;
  const diferencia = finalNum - esperadoEnCaja;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (fondoFinal === '' || fondoFinal < 0) {
      setErrorMsg('El valor final en gaveta no puede ser negativo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onCerrar(Number(fondoFinal));
      if (res.ok) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al cerrar el turno.');
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <TriangleAlertIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold font-[family-name:var(--font-anton)] uppercase tracking-wide">
                Cierre y Arqueo de Caja
              </h2>
              <p className="text-xs text-slate-400">
                Conciliación y cuadre de turno (RF-FMC-A4).
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

          {/* Resumen del Turno */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>Fondo Inicial (Base):</span>
              <span className="font-mono font-bold text-white">{formatCOP(fondoInicial)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Ventas Acumuladas:</span>
              <span className="font-mono font-bold text-[#10b981]">{formatCOP(ventas)}</span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.06] text-slate-200">
              <span className="font-semibold">Efectivo Teórico Esperado:</span>
              <span className="font-mono font-bold text-[#e3b341]">{formatCOP(esperadoEnCaja)}</span>
            </div>
          </div>

          {/* Arqueo Final */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Efectivo Físico Arqueado en Gaveta *
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              placeholder="Total contado en caja"
              value={fondoFinal}
              onChange={(e) => setFondoFinal(e.target.value !== '' ? Number(e.target.value) : '')}
              required
              className="w-full h-11 px-3 rounded-xl bg-[#09132b] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-[#e3b341] font-mono font-bold"
            />
          </div>

          {/* Diferencia en Vivo */}
          {fondoFinal !== '' && (
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between text-xs">
              <span className="text-slate-400">Diferencia de arqueo:</span>
              <div className="font-mono font-bold">
                {diferencia > 0 && (
                  <span className="text-[#10b981]">+{formatCOP(diferencia)} (Sobrante)</span>
                )}
                {diferencia < 0 && (
                  <span className="text-red-400">{formatCOP(diferencia)} (Faltante)</span>
                )}
                {diferencia === 0 && (
                  <span className="text-blue-300">Cuadre exacto (Sin diferencia)</span>
                )}
              </div>
            </div>
          )}

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
              disabled={isSubmitting || fondoFinal === ''}
              className="font-bold uppercase text-xs"
            >
              {isSubmitting ? 'Cerrando Turno...' : 'Cerrar Turno'}
            </Button3D>
          </div>
        </form>
      </div>
    </div>
  );
}
