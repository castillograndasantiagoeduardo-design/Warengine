'use client';

/**
 * MisCotizacionesB2BModal.tsx — Seguimiento de cotizaciones B2B del vendedor.
 * Modo A: permite facturar y pasar a "Pedido en Proceso" únicamente cotizaciones ya avaladas.
 */

import React, { useState } from 'react';
import type { CotizacionB2BDto } from '../types';

interface MisCotizacionesB2BModalProps {
  isOpen: boolean;
  onClose: () => void;
  cotizaciones: CotizacionB2BDto[];
  isLoading: boolean;
  facturandoId: string | null;
  onRecargar: () => void;
  onFacturar: (cotizacionId: string) => Promise<{ ok: boolean; error?: string }>;
}

const ESTADO_BADGE: Record<string, { label: string; cls: string }> = {
  pendiente_aval: {
    label: 'Pendiente de aval',
    cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  aprobada: {
    label: 'Avalada — Lista para facturar',
    cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  rechazada: {
    label: 'Rechazada',
    cls: 'bg-red-500/20 text-red-300 border-red-500/40',
  },
  facturada: {
    label: 'Facturada',
    cls: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  },
  vencida: {
    label: 'Vencida',
    cls: 'bg-white/10 text-white/50 border-white/20',
  },
};

const PEDIDO_BADGE: Record<string, string> = {
  en_proceso: 'Pedido en proceso',
  despachado: 'Despachado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export function MisCotizacionesB2BModal({
  isOpen,
  onClose,
  cotizaciones,
  isLoading,
  facturandoId,
  onRecargar,
  onFacturar,
}: MisCotizacionesB2BModalProps) {
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFacturar = async (id: string) => {
    setErrorAccion(null);
    const res = await onFacturar(id);
    if (!res.ok && res.error) {
      setErrorAccion(res.error);
    } else if (res.ok) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#14213D] border border-white/10 rounded-2xl shadow-2xl text-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-base font-semibold text-[#E9B949] uppercase tracking-wider">
              Mis Cotizaciones y Pedidos B2B
            </h2>
            <p className="text-xs text-white/60">
              Solo las cotizaciones con aval del Admin de Sucursal pueden facturarse y pasar a pedido en proceso.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRecargar}
              className="px-3 py-1.5 rounded-lg border border-white/15 text-xs text-white/80 hover:bg-white/5 cursor-pointer"
            >
              Actualizar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-white/50 hover:text-white text-xl px-1 cursor-pointer"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {errorAccion && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
              {errorAccion}
            </div>
          )}

          {isLoading ? (
            <p className="text-center text-xs text-white/60 py-10">Cargando cotizaciones...</p>
          ) : cotizaciones.length === 0 ? (
            <p className="text-center text-xs text-white/50 py-10">
              Aún no has enviado cotizaciones B2B.
            </p>
          ) : (
            cotizaciones.map((cot) => {
              const badge = ESTADO_BADGE[cot.estado] ?? {
                label: cot.estado,
                cls: 'bg-white/10 text-white/70 border-white/20',
              };
              const isFacturando = facturandoId === cot.id;

              return (
                <div
                  key={cot.id}
                  className="p-4 rounded-xl bg-[#0d1630] border border-white/10 space-y-2.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-[#E9B949] font-semibold">
                        COT-{String(cot.consecutivo).padStart(4, '0')}
                      </span>
                      <span className="mx-2 text-white/30">•</span>
                      <span className="font-medium text-white">
                        {cot.clienteNombre || cot.clienteId}
                      </span>
                      {cot.clienteDocumento && (
                        <span className="ml-2 text-white/50 font-mono text-[11px]">
                          ({cot.clienteDocumento})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] border ${badge.cls}`}>
                        {badge.label}
                      </span>
                      {cot.estadoPedido && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] border bg-indigo-500/20 text-indigo-200 border-indigo-400/40">
                          {PEDIDO_BADGE[cot.estadoPedido] ?? cot.estadoPedido}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-white/70">
                    <span>
                      {cot.items.length} ítems • Pago: <strong>{cot.medioPagoSugerido}</strong> • Válida hasta:{' '}
                      {new Date(cot.validaHasta).toLocaleDateString('es-CO')}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-[#E9B949]">
                      ${cot.total.toLocaleString('es-CO')} COP
                    </span>
                  </div>

                  {cot.estado === 'rechazada' && cot.motivoRechazo && (
                    <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 text-[11px]">
                      <strong>Motivo del rechazo:</strong> {cot.motivoRechazo}
                    </div>
                  )}

                  {cot.estado === 'aprobada' && (
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-emerald-300">
                        Aval otorgado por {cot.aprobadoPorEmail || 'Admin de Sucursal'}. Ya puedes facturar.
                      </span>
                      <button
                        type="button"
                        disabled={isFacturando}
                        onClick={() => handleFacturar(cot.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#070d1a] font-semibold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
                      >
                        {isFacturando ? 'Facturando...' : 'Facturar y pasar a Pedido en Proceso'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
