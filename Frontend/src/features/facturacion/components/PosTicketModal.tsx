'use client';

/**
 * PosTicketModal.tsx — Comprobante de venta térmico y formato de impresión POS.
 */

import React from 'react';
import type { FacturaDto, ClienteDto } from '../types/pos.types';

interface PosTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  factura: FacturaDto | null;
  /** null al reimprimir desde el historial (la factura solo trae clienteId). */
  cliente: ClienteDto | null;
  sucursalNombre: string;
  cambioEntregado: number;
  /** productoId → nombre, tomado del carrito al cobrar (la factura solo trae productoId). */
  nombresProducto?: Record<string, string>;
  onNuevaVenta: () => void;
}

export function PosTicketModal({
  isOpen,
  factura,
  cliente,
  sucursalNombre,
  cambioEntregado,
  nombresProducto = {},
  onNuevaVenta,
}: PosTicketModalProps) {
  if (!isOpen || !factura) return null;

  const formatoCOP = (monto: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(monto);

  const handleImprimir = () => {
    window.print();
  };

  const fechaFormateada = factura.fecha
    ? new Date(factura.fecha).toLocaleString('es-CO')
    : new Date().toLocaleString('es-CO');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#0f1b3d] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Encabezado Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
              ✓
            </span>
            <span className="text-xs font-bold text-emerald-400 font-[family-name:var(--font-ui)] uppercase">
              Venta Exitosa
            </span>
          </div>
          <span className="text-xs text-white/40 font-mono">
            #FAC-{String(factura.consecutivo).padStart(5, '0')}
          </span>
        </div>

        {/* Ticket Térmico Imprimible */}
        <div
          id="pos-ticket-print"
          className="bg-white text-black p-5 rounded-xl font-mono text-[11px] leading-relaxed shadow-inner overflow-y-auto max-h-[50vh] select-text"
        >
          {/* Cabecera del Comercio */}
          <div className="text-center border-b border-dashed border-black/30 pb-3 mb-3">
            <h2 className="font-bold text-sm tracking-widest uppercase">WARENGINE</h2>
            <p className="text-[10px] text-black/70">SISTEMA ERP & POS COMERCIAL</p>
            <p className="text-[10px] text-black/70 font-semibold">{sucursalNombre || 'Sede Principal'}</p>
            <p className="text-[9px] text-black/50 mt-1">NIT: 900.123.456-7 · IVA Régimen Común</p>
          </div>

          {/* Datos de la Factura */}
          <div className="border-b border-dashed border-black/30 pb-2 mb-2 text-[10px] space-y-0.5">
            <div className="flex justify-between">
              <span className="font-bold">Factura de Venta:</span>
              <span>#FAC-{String(factura.consecutivo).padStart(5, '0')}</span>
            </div>
            <div className="flex justify-between">
              <span>Fecha:</span>
              <span>{fechaFormateada}</span>
            </div>
            <div className="flex justify-between">
              <span>Cliente:</span>
              <span className="font-semibold truncate max-w-[150px]">{cliente?.nombreRazonSocial ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>Doc / NIT:</span>
              <span>{cliente?.numeroDocumento ?? '—'}</span>
            </div>
          </div>

          {/* Tabla de Artículos */}
          <div className="border-b border-dashed border-black/30 pb-2 mb-2">
            <div className="flex justify-between font-bold text-[10px] mb-1">
              <span>CANT / DESCRIPCIÓN</span>
              <span>TOTAL</span>
            </div>
            <div className="space-y-1">
              {factura.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-start text-[10px]">
                  <span className="truncate max-w-[190px]">
                    {it.cantidad}x {nombresProducto[it.productoId] ?? `Prod #${it.productoId.slice(0, 8)}`}
                  </span>
                  <span className="font-semibold">{formatoCOP(it.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-black/30 pb-2 mb-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatoCOP(factura.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA (0%):</span>
              <span>{formatoCOP(factura.iva)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold pt-1 border-t border-black/10">
              <span>TOTAL A PAGAR:</span>
              <span>{formatoCOP(factura.total)}</span>
            </div>
          </div>

          {/* Formas de Pago y Devuelta */}
          <div className="space-y-0.5 text-[10px] border-b border-dashed border-black/30 pb-2 mb-2">
            {factura.pagos.map((p, idx) => (
              <div key={idx} className="flex justify-between uppercase">
                <span>Pago ({p.medioPago}):</span>
                <span>{formatoCOP(p.monto)}</span>
              </div>
            ))}
            {cambioEntregado > 0 && (
              <div className="flex justify-between font-bold text-emerald-800">
                <span>Cambio / Devuelta:</span>
                <span>{formatoCOP(cambioEntregado)}</span>
              </div>
            )}
          </div>

          {/* Pie de Página Térmico */}
          <div className="text-center text-[9px] text-black/60 pt-2 space-y-0.5">
            <p className="font-semibold">¡GRACIAS POR SU COMPRA!</p>
            <p>Comprobante generado por WarEngine POS</p>
          </div>
        </div>

        {/* Acciones del Modal */}
        <div className="flex items-center gap-2.5 mt-4 pt-1">
          <button
            type="button"
            onClick={handleImprimir}
            className="w-1/2 py-2.5 rounded-xl bg-[#14213D] hover:bg-[#1a2b50] border border-white/20 text-white font-[family-name:var(--font-ui)] text-xs font-bold uppercase cursor-pointer transition-colors flex items-center justify-center gap-1.5"
          >
            <span>🖨️</span>
            <span>Imprimir</span>
          </button>
          <button
            type="button"
            onClick={onNuevaVenta}
            autoFocus
            className="w-1/2 py-2.5 rounded-xl bg-[#e3b341] hover:bg-[#e9b949] text-black font-[family-name:var(--font-ui)] text-xs font-bold uppercase cursor-pointer shadow-[0_3px_0_#b88a1f] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5"
          >
            <span>➕</span>
            <span>Nueva Venta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
