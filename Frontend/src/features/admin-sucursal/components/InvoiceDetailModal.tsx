'use client';

/**
 * InvoiceDetailModal.tsx — Comprobante detallado de factura y medios de pago (RF-FMC-E8).
 * 
 * Principio SOLID: Single Responsibility Principle (SRP).
 * Visualiza el desglose completo del comprobante de venta, ítems facturados,
 * medios de pago registrados y estado de validez fiscal/operativa.
 */

import React from 'react';
import { ReceiptTextIcon, DollarSignIcon, ShieldIcon } from './Icons';
import type { FacturaSede } from '../types/branch-invoicing.types';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  factura: FacturaSede | null;
  onClose: () => void;
  onAnularClick: (factura: FacturaSede) => void;
}

export function InvoiceDetailModal({
  isOpen,
  factura,
  onClose,
  onAnularClick,
}: InvoiceDetailModalProps) {
  if (!isOpen || !factura) return null;

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);

  const esAnulada = factura.estado === 'anulada';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050b18]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0d1630] border border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* 1. Cabecera del Comprobante */}
        <div className="px-6 py-4 bg-gradient-to-b from-[#18264d] to-[#0d1630] border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e3b341]/15 text-[#e3b341] border border-[#e3b341]/30">
              <ReceiptTextIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white uppercase font-[family-name:var(--font-anton)] tracking-wider">
                  Comprobante {factura.folioFormateado}
                </h2>
                <span
                  className={`
                    px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border
                    ${
                      esAnulada
                        ? 'bg-red-500/15 text-red-400 border-red-500/30'
                        : 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
                    }
                  `}
                >
                  {esAnulada ? 'Factura Anulada' : 'Emitida · Válida'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-[family-name:var(--font-archivo)]">
                Fecha de emisión: {factura.fechaFormateada}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* 2. Cuerpo Scrollable */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          
          {/* Banner de Estado Anulada si aplica */}
          {esAnulada && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
              <span className="text-base">🚫</span>
              <div>
                <p className="font-bold text-white uppercase">Factura Anulada Administrativamente</p>
                <p className="text-[11px] text-red-300/90 mt-0.5">
                  El importe total fue descontado del cierre de ventas y las unidades de stock fueron restituidas al Kardex de la sede.
                </p>
              </div>
            </div>
          )}

          {/* Bloque Metadatos Cliente y Operador */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Cliente / Titular</span>
              <p className="font-bold text-white text-sm">{factura.clienteNombre}</p>
              <p className="text-slate-300 font-mono text-[11px]">Doc: {factura.clienteDocumento}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Caja & Operador</span>
              <p className="font-bold text-white text-sm">{factura.cajeroNombre || 'Cajero en Turno'}</p>
              <p className="text-slate-300 font-mono text-[11px]">
                Turno: {factura.turnoCajaId ? `#${factura.turnoCajaId.slice(0, 8)}` : 'Venta Directa'}
              </p>
            </div>
          </div>

          {/* Tabla de Productos Facturados */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-[family-name:var(--font-archivo)]">
              Productos y Servicios Facturados
            </h3>

            <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-white/[0.01]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-slate-400 text-[10px] uppercase font-mono">
                    <th className="py-2.5 px-3">Producto / Descripción</th>
                    <th className="py-2.5 px-3 text-center">Cant.</th>
                    <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {factura.items.map((it) => (
                    <tr key={it.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-white block">{it.productoNombre}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {it.productoId.slice(0, 8)}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-200">
                        {it.cantidad}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {formatCOP(it.precioUnitario)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        {formatCOP(it.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Desglose de Medios de Pago y Totales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            
            {/* Medios de Pago */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Medios de Pago Asentados</span>
              <div className="space-y-1.5">
                {factura.pagos.map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-xs">
                    <span className="capitalize text-slate-300 font-medium">
                      💳 {p.medioPago.replace('_', ' ')}
                    </span>
                    <span className="font-mono font-bold text-white">{formatCOP(p.monto)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cuadro de Totales */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal Neto:</span>
                <span className="font-mono text-slate-200">{formatCOP(factura.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>IVA (0% / 19%):</span>
                <span className="font-mono text-slate-200">{formatCOP(factura.iva)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-white/[0.06] text-white">
                <span className="uppercase font-[family-name:var(--font-anton)] tracking-wider">Total Facturado:</span>
                <span className="font-mono text-[#e3b341] text-base">{factura.totalFormateado}</span>
              </div>
            </div>
          </div>

        </div>

        {/* 3. Footer con Acciones */}
        <div className="px-6 py-4 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/20 text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-xs font-semibold cursor-pointer"
          >
            Cerrar Comprobante
          </button>

          {!esAnulada && (
            <button
              type="button"
              onClick={() => onAnularClick(factura)}
              className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider font-[family-name:var(--font-ui)] transition-all cursor-pointer"
            >
              Anular Esta Factura
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
