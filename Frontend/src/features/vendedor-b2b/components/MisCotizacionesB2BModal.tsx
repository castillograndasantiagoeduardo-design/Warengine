'use client';

/**
 * MisCotizacionesB2BModal.tsx — Seguimiento de cotizaciones B2B del vendedor.
 * Modo A: permite facturar y pasar a "Pedido en Proceso" únicamente cotizaciones ya avaladas.
 */

import React, { useState } from 'react';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { ModalVidrio } from './ModalVidrio';
import { Insignia } from '@/components/Insignia';
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

const ESTADO_COTIZACION_CONFIG: Record<
  string,
  {
    label: string;
    variante: 'warning' | 'success' | 'danger' | 'info' | 'neutral';
  }
> = {
  pendiente_aval: {
    label: 'Pendiente de aval',
    variante: 'warning',
  },
  aprobada: {
    label: 'Avalada — Lista para facturar',
    variante: 'success',
  },
  rechazada: {
    label: 'Rechazada',
    variante: 'danger',
  },
  facturada: {
    label: 'Facturada',
    variante: 'info',
  },
  vencida: {
    label: 'Vencida',
    variante: 'neutral',
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
  const [itemsExpandidos, setItemsExpandidos] = useState<Record<string, boolean>>({});

  const toggleItems = (id: string) => {
    setItemsExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
    <ModalVidrio
      open={isOpen}
      onClose={onClose}
      title="Mis cotizaciones y pedidos B2B"
      description="Solo las cotizaciones con aval del Admin de Sucursal pueden facturarse y pasar a pedido en proceso."
      size="2xl"
    >
      <div className="space-y-4">
        {/* Barra superior de acciones dentro del modal */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-sans text-text-muted">
            Total cotizaciones registradas: <strong className="text-text tabular-nums font-semibold">{cotizaciones.length}</strong>
          </span>
          <button
            type="button"
            onClick={onRecargar}
            className="superficie-control rounded-xl px-3 py-1.5 text-xs text-text hover:border-brand-400/40 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {errorAccion && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs">
            {errorAccion}
          </div>
        )}

        {isLoading ? (
          <p className="text-center text-xs text-text-muted py-12 font-mono">
            Cargando cotizaciones corporativas...
          </p>
        ) : cotizaciones.length === 0 ? (
          <p className="text-center text-xs text-text-muted py-12">
            Aún no has enviado cotizaciones B2B.
          </p>
        ) : (
          <div className="space-y-3">
            {cotizaciones.map((cot) => {
              const estadoConfig = ESTADO_COTIZACION_CONFIG[cot.estado] ?? {
                label: cot.estado,
                variante: 'neutral' as const,
              };
              const isFacturando = facturandoId === cot.id;
              const expandido = Boolean(itemsExpandidos[cot.id]);

              return (
                <div
                  key={cot.id}
                  className="p-4 rounded-xl superficie-control space-y-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-text bg-bg/60 border border-border px-2 py-0.5 rounded-md">
                        COT-{String(cot.consecutivo).padStart(4, '0')}
                      </span>
                      <span className="font-sans font-medium text-text">
                        {cot.clienteNombre || cot.clienteId}
                      </span>
                      {cot.clienteDocumento && (
                        <span className="text-text-muted font-mono text-[11px]">
                          ({cot.clienteDocumento})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Insignia
                        variante={estadoConfig.variante}
                        conPunto
                        tamano="sm"
                      >
                        {estadoConfig.label}
                      </Insignia>
                      {cot.estadoPedido && (
                        <Insignia variante="brand" conPunto tamano="sm">
                          {PEDIDO_BADGE[cot.estadoPedido] ?? cot.estadoPedido}
                        </Insignia>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-text-muted">
                    <div className="flex items-center gap-3">
                      <span>
                        {cot.items.length} ítems • Pago: <strong className="text-text font-medium">{cot.medioPagoSugerido}</strong> • Válida hasta:{' '}
                        <span className="tabular-nums">{new Date(cot.validaHasta).toLocaleDateString('es-CO')}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleItems(cot.id)}
                        className="text-[11px] text-brand-500 hover:text-brand-400 font-sans font-medium hover:underline cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <span>{expandido ? 'Ocultar productos' : 'Ver productos pedidos'}</span>
                        {expandido ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    <span className="text-sm font-titulos font-semibold tabular-nums text-text">
                      ${cot.total.toLocaleString('es-CO')} COP
                    </span>
                  </div>

                  {expandido && (
                    <div className="p-3 rounded-xl bg-bg/50 border border-border space-y-2">
                      <div className="text-[11px] uppercase tracking-wider font-medium text-text-muted">
                        Detalle de productos cotizados
                      </div>
                      <div className="space-y-1.5">
                        {cot.items.map((i) => (
                          <div
                            key={i.id}
                            className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-none"
                          >
                            <div>
                              <span className="text-text font-medium">
                                {i.productoNombre || 'Producto'}
                              </span>
                              <span className="text-text-muted font-mono ml-1.5">
                                ({i.productoSku || 'N/D'})
                              </span>
                              <span className="text-text-muted ml-2 font-sans tabular-nums">
                                × {i.cantidad} u.
                              </span>
                            </div>
                            <span className="font-mono text-text tabular-nums">
                              ${i.subtotal.toLocaleString('es-CO')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {cot.estado === 'rechazada' && cot.motivoRechazo && (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs">
                      <strong className="font-medium">Motivo del rechazo:</strong> {cot.motivoRechazo}
                    </div>
                  )}

                  {cot.estado === 'aprobada' && (
                    <div className="pt-2.5 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                        Aval otorgado por {cot.aprobadoPorEmail || 'Admin de Sucursal'}. Ya puedes facturar.
                      </span>
                      <button
                        type="button"
                        disabled={isFacturando}
                        onClick={() => handleFacturar(cot.id)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-btn-primario-texto font-sans font-medium text-xs transition-all cursor-pointer disabled:opacity-50 shadow-sm shadow-brand-600/30 shrink-0"
                      >
                        {isFacturando ? 'Facturando...' : 'Facturar y pasar a pedido en proceso'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ModalVidrio>
  );
}
