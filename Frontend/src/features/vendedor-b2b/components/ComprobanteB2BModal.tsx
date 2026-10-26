'use client';

/**
 * ComprobanteB2BModal.tsx — Comprobante formal de orden / factura comercial B2B emitida.
 */

import React from 'react';
import type { FacturaDto } from '../types';

interface ComprobanteB2BModalProps {
  factura: FacturaDto | null;
  onClose: () => void;
}

export function ComprobanteB2BModal({ factura, onClose }: ComprobanteB2BModalProps) {
  if (!factura) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#14213D] border border-[#E9B949]/40 rounded-2xl shadow-2xl p-6 text-white text-xs">
        <div className="text-center pb-4 border-b border-white/10">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-2 text-xl font-bold">
            ✓
          </div>
          <h2 className="text-base font-bold text-[#E9B949] uppercase tracking-wider">
            Factura B2B Emitida
          </h2>
          <p className="text-white/60 text-[11px]">
            Consecutivo #{factura.consecutivo} &bull; Estado: <span className="text-emerald-300 font-semibold uppercase">{factura.estado}</span>
          </p>
        </div>

        <div className="py-4 space-y-2.5">
          <div className="flex justify-between text-white/60">
            <span>Fecha y Hora:</span>
            <span className="text-white font-mono">
              {new Date(factura.fecha).toLocaleString('es-CO')}
            </span>
          </div>

          <div className="flex justify-between text-white/60">
            <span>Condición de Facturación:</span>
            <span className="text-[#E9B949] font-medium">B2B Corporativo (Sin Turno)</span>
          </div>

          <div className="pt-2 border-t border-white/5 space-y-1">
            <span className="text-[10px] text-white/50 block uppercase">Ítems Facturados:</span>
            {factura.items?.map((i, idx) => (
              <div key={i.id || idx} className="flex justify-between text-white/80">
                <span>{i.cantidad}x Producto ID: {i.productoId.slice(0, 8)}...</span>
                <span className="font-mono">${i.subtotal.toLocaleString('es-CO')}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-white/10 space-y-1">
            <div className="flex justify-between text-white/60">
              <span>Subtotal:</span>
              <span className="font-mono">${factura.subtotal.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>IVA:</span>
              <span className="font-mono">${factura.iva.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white pt-1">
              <span>Total Comercial:</span>
              <span className="font-mono text-[#E9B949]">
                ${factura.total.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-white font-medium text-center"
          >
            Imprimir Comprobante
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#E9B949] to-[#b88a1f] text-[#14213D] font-bold uppercase tracking-wider hover:brightness-110"
          >
            Nueva Cotización
          </button>
        </div>
      </div>
    </div>
  );
}
