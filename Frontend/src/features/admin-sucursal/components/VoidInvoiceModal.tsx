'use client';

/**
 * VoidInvoiceModal.tsx — Modal para anulación administrativa de facturas (RF-FMC-E10).
 * 
 * Principio SOLID: Single Responsibility Principle (SRP).
 * Asienta la anulación de comprobantes por error involuntario o devolución total,
 * advirtiendo y ejecutando la reposición atómica de stock en el kardex de la sede.
 */

import React, { useState, useEffect } from 'react';
import { Button3D } from '@/components/ui/Button3D';
import { ShieldIcon, ReceiptTextIcon } from './Icons';
import type { FacturaSede } from '../types/branch-invoicing.types';

interface VoidInvoiceModalProps {
  isOpen: boolean;
  factura: FacturaSede | null;
  onClose: () => void;
  onAnular: (id: string, motivo: string) => Promise<{ ok: boolean; error?: string }>;
}

export function VoidInvoiceModal({
  isOpen,
  factura,
  onClose,
  onAnular,
}: VoidInvoiceModalProps) {
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMotivo('');
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !factura) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const motivoTrimmed = motivo.trim();
    if (motivoTrimmed.length < 5) {
      setErrorMsg('El motivo de anulación es obligatorio y debe tener al menos 5 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onAnular(factura.id, motivoTrimmed);
      if (!res.ok) {
        setErrorMsg(res.error || 'No fue posible anular la factura.');
        return;
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al anular la factura.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050b18]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0d1630] border border-red-500/40 shadow-[0_20px_50px_rgba(239,68,68,0.2)] overflow-hidden">
        
        {/* Cabecera de Alerta Crítica */}
        <div className="px-6 py-5 bg-gradient-to-b from-red-950/40 to-[#0d1630] border-b border-red-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                <ShieldIcon size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white uppercase font-[family-name:var(--font-anton)] tracking-wider">
                  Anular Factura {factura.folioFormateado}
                </h2>
                <p className="text-xs text-red-300 font-[family-name:var(--font-archivo)]">
                  Operación administrativa irreversible con reversión de existencias.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8 w-8 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Formulario de Anulación */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Resumen de la Factura */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Cliente:</span>
              <span className="font-semibold text-white">{factura.clienteNombre} ({factura.clienteDocumento})</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Fecha de emisión:</span>
              <span className="font-mono text-slate-300">{factura.fechaFormateada}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Monto total:</span>
              <span className="font-mono font-bold text-[#e3b341] text-sm">{factura.totalFormateado}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Productos vendidos:</span>
              <span className="font-mono text-slate-200">{factura.items.length} ítem(s)</span>
            </div>
          </div>

          {/* Advertencia de Reposición de Stock (RF-FMC-E10) */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-300">
              <span>⚠️</span>
              <span>Impacto en Inventario & Kardex</span>
            </p>
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              Al confirmar esta anulación, las cantidades de los productos facturados serán **reintegradas automáticamente al stock físico de la sucursal** con movimiento de reversión en el Kardex.
            </p>
          </div>

          {/* Motivo Obligatorio */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-[family-name:var(--font-archivo)]">
              Motivo de la anulación <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Error en medio de pago registrado por el cajero / Devolución total por cliente..."
              maxLength={255}
              className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/40 resize-none font-[family-name:var(--font-archivo)]"
              required
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>Mínimo 5 caracteres</span>
              <span>{motivo.length} / 255</span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-white/20 text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600
                text-white text-xs font-bold uppercase tracking-wider font-[family-name:var(--font-ui)]
                border border-red-400/30 shadow-[0_4px_15px_rgba(220,38,38,0.4)]
                active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50
              "
            >
              {isSubmitting ? 'Anulando...' : 'Confirmar Anulación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
