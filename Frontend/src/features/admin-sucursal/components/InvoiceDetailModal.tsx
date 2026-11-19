'use client';

/**
 * InvoiceDetailModal.tsx — Comprobante detallado de factura y medios de pago (RF-FMC-E8).
 * 
 * Reutiliza el diálogo accesible `<Modal>` de `@/components/ui/Modal`
 * y consume `GET /ventas/facturas/:id` para traer datos en tiempo real.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { formatCOP } from '@/lib/format/moneda';
import { branchInvoicingService } from '../api/branch-invoicing.service';
import type { FacturaSede } from '../types/branch-invoicing.types';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  facturaId: string | null;
  onClose: () => void;
  onAnularClick: (factura: FacturaSede) => void;
  onDevolucionClick: (factura: FacturaSede) => void;
}

export function InvoiceDetailModal({
  isOpen,
  facturaId,
  onClose,
  onAnularClick,
  onDevolucionClick,
}: InvoiceDetailModalProps) {
  const [factura, setFactura] = useState<FacturaSede | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !facturaId) {
      setFactura(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    branchInvoicingService
      .obtenerFacturaPorId(facturaId)
      .then((data) => {
        if (isMounted) setFactura(data);
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.message || 'Error al cargar los detalles de la factura.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, facturaId]);

  // Calcula si quedan unidades por devolver
  const tieneUnidadesDevolvibles = useMemo(() => {
    if (!factura || factura.estado === 'anulada') return false;
    const devueltosPorItem = new Map<string, number>();
    for (const dev of factura.devoluciones || []) {
      const prev = devueltosPorItem.get(dev.facturaItemId) ?? 0;
      devueltosPorItem.set(dev.facturaItemId, prev + dev.cantidad);
    }

    return factura.items.some((it) => {
      const yaDevuelto = devueltosPorItem.get(it.id) ?? 0;
      return it.cantidad - yaDevuelto > 0;
    });
  }, [factura]);

  const esAnulada = factura?.estado === 'anulada';

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={factura ? `Comprobante ${factura.folioFormateado}` : 'Detalle de Factura'}
      description={factura ? `Emisión: ${factura.fechaFormateada}` : undefined}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/20 text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-xs font-semibold cursor-pointer"
          >
            Cerrar
          </button>

          {factura && !esAnulada && (
            <div className="flex items-center gap-2">
              {tieneUnidadesDevolvibles && (
                <button
                  type="button"
                  onClick={() => onDevolucionClick(factura)}
                  className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Registrar Devolución
                </button>
              )}
              <button
                type="button"
                onClick={() => onAnularClick(factura)}
                className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Anular Factura
              </button>
            </div>
          )}
        </div>
      }
    >
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e3b341] border-t-transparent" />
          <p className="text-xs">Consultando comprobante en el servidor...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs">
          {error}
        </div>
      ) : factura ? (
        <div className="space-y-5">
          {/* Banner de Estado Anulada */}
          {esAnulada && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
              <span className="text-base" aria-hidden="true">🚫</span>
              <div>
                <p className="font-bold text-white uppercase">Factura Anulada Administrativamente</p>
                <p className="text-[11px] text-red-300/90 mt-0.5">
                  El importe total fue revertido y las unidades de stock fueron restituidas al Kardex de la sede.
                </p>
              </div>
            </div>
          )}

          {/* Estado y tipo */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Estado:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border ${
                  esAnulada
                    ? 'bg-red-500/15 text-red-400 border-red-500/30'
                    : 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
                }`}
              >
                {esAnulada ? 'Factura Anulada' : 'Emitida · Válida'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Tipo de Venta:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${
                  factura.tipoVenta === 'B2B'
                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                }`}
              >
                {factura.tipoVenta || 'POS'}
              </span>
            </div>
          </div>

          {/* Bloque Metadatos Cliente y Operador */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Cliente / Titular</span>
              <p className="font-bold text-white text-sm">{factura.clienteNombre || 'Consumidor Final'}</p>
              <p className="text-slate-300 font-mono text-[11px]">Doc: {factura.clienteDocumento || '222222222222'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Cajero / Operador</span>
              <p className="font-bold text-white text-sm">{factura.cajeroNombre || 'Cajero de Turno'}</p>
              <p className="text-slate-300 font-mono text-[11px]">
                {factura.turnoCajaId ? `Turno: ${factura.turnoCajaId.slice(0, 8)}...` : 'Venta B2B Directa'}
              </p>
            </div>
          </div>

          {/* Tabla de Productos Facturados */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Productos y Servicios Facturados
            </h3>

            <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-white/[0.01]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-slate-400 text-[10px] uppercase font-mono">
                    <th scope="col" className="py-2.5 px-3">Producto / Descripción</th>
                    <th scope="col" className="py-2.5 px-3 text-center">Cant.</th>
                    <th scope="col" className="py-2.5 px-3 text-right">Precio Unit.</th>
                    <th scope="col" className="py-2.5 px-3 text-right">Subtotal</th>
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

          {/* Medios de Pago y Totales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <span className="uppercase tracking-wider">Total Facturado:</span>
                <span className="font-mono text-[#e3b341] text-base">{factura.totalFormateado}</span>
              </div>
            </div>
          </div>

          {/* Sección de Devoluciones Asociadas */}
          {factura.devoluciones && factura.devoluciones.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/[0.08]">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>↩️</span>
                <span>Devoluciones Registradas ({factura.devoluciones.length})</span>
              </h3>
              <div className="space-y-2">
                {factura.devoluciones.map((dev) => (
                  <div
                    key={dev.id}
                    className="p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-slate-400">{dev.fechaFormateada}</span>
                      <span className="font-mono font-bold text-amber-300">
                        Reembolso: {dev.montoReembolsoFormateado}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300 text-[11px]">
                      <span>Cantidad: {dev.cantidad} unidad(es)</span>
                      <span>Stock reingresado: {dev.reingresaStock ? 'Sí' : 'No'}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] italic">Motivo: {dev.motivo}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
