'use client';

/**
 * ComprobanteB2BModal.tsx — Comprobante formal de orden / factura comercial B2B emitida.
 */

import React from 'react';
import { CheckCircle2, Printer } from 'lucide-react';
import { ModalVidrio } from './ModalVidrio';
import { Insignia } from '@/components/Insignia';
import type { FacturaDto } from '../types';

interface ComprobanteB2BModalProps {
  factura: FacturaDto | null;
  onClose: () => void;
}

export function ComprobanteB2BModal({ factura, onClose }: ComprobanteB2BModalProps) {
  if (!factura) return null;

  return (
    <ModalVidrio
      open={Boolean(factura)}
      onClose={onClose}
      size="md"
    >
      <div className="text-center pb-4 border-b border-border">
        <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/25 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-titulos font-semibold text-text tracking-normal">
          Factura B2B emitida
        </h2>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="font-mono text-xs text-text-muted">
            Consecutivo #{factura.consecutivo}
          </span>
          <Insignia variante="success" conPunto tamano="sm">
            {factura.estado}
          </Insignia>
        </div>
      </div>

      <div className="py-4 space-y-3 text-xs">
        <div className="flex justify-between text-text-muted">
          <span>Fecha y hora:</span>
          <span className="text-text font-mono tabular-nums">
            {new Date(factura.fecha).toLocaleString('es-CO')}
          </span>
        </div>

        <div className="flex justify-between text-text-muted">
          <span>Condición de facturación:</span>
          <span className="text-brand-600 dark:text-brand-400 font-medium">
            B2B Corporativo (Sin turno)
          </span>
        </div>

        <div className="pt-2 border-t border-border space-y-1.5">
          <span className="text-[11px] font-sans font-medium text-text-muted block">
            Ítems facturados:
          </span>
          <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar">
            {factura.items?.map((i, idx) => (
              <div key={i.id || idx} className="flex justify-between text-xs py-0.5">
                <span className="text-text font-sans tabular-nums">
                  {i.cantidad}× Producto ID: <span className="font-mono">{i.productoId.slice(0, 8)}...</span>
                </span>
                <span className="font-mono text-text tabular-nums">
                  ${i.subtotal.toLocaleString('es-CO')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-border space-y-1 text-xs">
          <div className="flex justify-between text-text-muted">
            <span>Subtotal:</span>
            <span className="font-mono text-text tabular-nums">
              ${factura.subtotal.toLocaleString('es-CO')}
            </span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>IVA:</span>
            <span className="font-mono text-text tabular-nums">
              ${factura.iva.toLocaleString('es-CO')}
            </span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-text pt-1.5 border-t border-border">
            <span className="font-titulos">Total comercial:</span>
            <span className="font-titulos font-semibold text-brand-600 dark:text-brand-400 tabular-nums text-base">
              ${factura.total.toLocaleString('es-CO')}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border flex items-center gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 py-2 px-3 rounded-xl superficie-control text-text font-sans font-medium text-xs hover:border-brand-400/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimir comprobante</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-btn-primario-texto font-sans font-medium text-xs transition-all cursor-pointer shadow-sm shadow-brand-600/30 flex items-center justify-center gap-1.5"
        >
          <span>Nueva cotización</span>
        </button>
      </div>
    </ModalVidrio>
  );
}
