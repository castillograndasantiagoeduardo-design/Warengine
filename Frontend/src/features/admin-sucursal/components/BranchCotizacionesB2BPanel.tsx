'use client';

/**
 * BranchCotizacionesB2BPanel.tsx — Gestión de avales de cotizaciones B2B y pedidos en proceso
 * para el Administrador de Sucursal.
 */

import React, { useCallback, useEffect, useState } from 'react';
import type { CotizacionB2BDto, EstadoPedidoB2B } from '@warengine/contracts';
import { apiClient, ApiError } from '@/lib/api';
import { GlassCard } from './GlassCard';

interface BranchCotizacionesB2BPanelProps {
  sucursalId: number;
}

const ESTADO_LABELS: Record<string, { label: string; cls: string }> = {
  pendiente_aval: {
    label: 'Pendiente de aval',
    cls: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
  },
  aprobada: {
    label: 'Avalada (espera factura)',
    cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
  },
  rechazada: {
    label: 'Rechazada',
    cls: 'bg-red-500/15 text-red-300 border-red-500/35',
  },
  facturada: {
    label: 'Facturada',
    cls: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
  },
};

export function BranchCotizacionesB2BPanel({ sucursalId }: BranchCotizacionesB2BPanelProps) {
  const [cotizaciones, setCotizaciones] = useState<CotizacionB2BDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [rechazoId, setRechazoId] = useState<string | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const cargar = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<CotizacionB2BDto[]>('/ventas/cotizaciones-b2b', {
        params: { sucursalId, limite: 50 },
      });
      setCotizaciones(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las cotizaciones B2B.');
    } finally {
      setIsLoading(false);
    }
  }, [sucursalId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const handleAvalar = async (id: string) => {
    setProcesandoId(id);
    setError(null);
    try {
      await apiClient.put(`/ventas/cotizaciones-b2b/${id}/avalar`);
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo otorgar el aval.');
    } finally {
      setProcesandoId(null);
    }
  };

  const handleConfirmarRechazo = async (id: string) => {
    if (motivoRechazo.trim().length < 5) {
      setError('El motivo de rechazo debe tener al menos 5 caracteres.');
      return;
    }
    setProcesandoId(id);
    setError(null);
    try {
      await apiClient.put(`/ventas/cotizaciones-b2b/${id}/rechazar`, {
        motivoRechazo: motivoRechazo.trim(),
      });
      setRechazoId(null);
      setMotivoRechazo('');
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo rechazar la cotización.');
    } finally {
      setProcesandoId(null);
    }
  };

  const handleEstadoPedido = async (id: string, estadoPedido: EstadoPedidoB2B) => {
    setProcesandoId(id);
    setError(null);
    try {
      await apiClient.put(`/ventas/cotizaciones-b2b/${id}/estado-pedido`, { estadoPedido });
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar el estado del pedido.');
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <GlassCard padding="lg" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-titulos font-semibold text-text">
            Avales de Cotizaciones B2B y Pedidos
          </h3>
          <p className="text-xs text-text-muted">
            Aprueba o rechaza las cotizaciones del Vendedor B2B. Una vez facturadas, gestiona su despacho.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void cargar()}
          className="px-3 py-1.5 rounded-xl superficie-control border border-border text-xs text-text hover:border-brand-400 cursor-pointer"
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/12 border border-red-500/30 text-red-300 text-xs">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-text-muted py-8 text-center">Cargando cotizaciones B2B...</p>
      ) : cotizaciones.length === 0 ? (
        <p className="text-xs text-text-muted py-8 text-center">
          No hay cotizaciones B2B registradas en esta sucursal.
        </p>
      ) : (
        <div className="space-y-3">
          {cotizaciones.map((cot) => {
            const badge = ESTADO_LABELS[cot.estado] ?? {
              label: cot.estado,
              cls: 'bg-white/10 text-text-muted border-border',
            };
            const ocupada = procesandoId === cot.id;

            return (
              <div
                key={cot.id}
                className="p-4 rounded-xl superficie-control border border-border space-y-2.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-semibold text-brand-300">
                      COT-{String(cot.consecutivo).padStart(4, '0')}
                    </span>
                    <span className="mx-2 text-text-muted">•</span>
                    <span className="font-medium text-text">
                      {cot.clienteNombre || cot.clienteId}
                    </span>
                    {cot.vendedorEmail && (
                      <span className="ml-2 text-text-muted">({cot.vendedorEmail})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] border ${badge.cls}`}>
                      {badge.label}
                    </span>
                    {cot.estadoPedido && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] border bg-sky-500/15 text-sky-300 border-sky-500/35">
                        Pedido: {cot.estadoPedido.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-text-muted">
                  <span>
                    {cot.items.length} ítems • Medio: {cot.medioPagoSugerido} • Vigente hasta{' '}
                    {new Date(cot.validaHasta).toLocaleDateString('es-CO')}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-text">
                    ${cot.total.toLocaleString('es-CO')} COP
                  </span>
                </div>

                {cot.observaciones && (
                  <p className="text-[11px] text-text-muted italic">Obs: {cot.observaciones}</p>
                )}

                {cot.estado === 'pendiente_aval' && (
                  <div className="pt-2 border-t border-border space-y-2">
                    {rechazoId === cot.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={motivoRechazo}
                          onChange={(e) => setMotivoRechazo(e.target.value)}
                          placeholder="Motivo del rechazo (mín. 5 caracteres)..."
                          className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg superficie-control border border-border text-xs text-text"
                        />
                        <button
                          type="button"
                          disabled={ocupada}
                          onClick={() => void handleConfirmarRechazo(cot.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium cursor-pointer disabled:opacity-50"
                        >
                          Confirmar rechazo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRechazoId(null);
                            setMotivoRechazo('');
                          }}
                          className="px-3 py-1.5 rounded-lg border border-border text-xs text-text-muted cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={ocupada}
                          onClick={() => setRechazoId(cot.id)}
                          className="px-3.5 py-1.5 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/15 text-xs font-medium cursor-pointer disabled:opacity-50"
                        >
                          Rechazar
                        </button>
                        <button
                          type="button"
                          disabled={ocupada}
                          onClick={() => void handleAvalar(cot.id)}
                          className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-btn-primario-texto text-xs font-medium cursor-pointer disabled:opacity-50"
                        >
                          {ocupada ? 'Aprobando...' : 'Dar Aval'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {cot.estado === 'facturada' && cot.estadoPedido === 'en_proceso' && (
                  <div className="pt-2 border-t border-border flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={ocupada}
                      onClick={() => void handleEstadoPedido(cot.id, 'despachado')}
                      className="px-3.5 py-1.5 rounded-lg bg-brand-600 text-btn-primario-texto text-xs font-medium cursor-pointer disabled:opacity-50"
                    >
                      Marcar Despachado
                    </button>
                  </div>
                )}

                {cot.estado === 'facturada' && cot.estadoPedido === 'despachado' && (
                  <div className="pt-2 border-t border-border flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={ocupada}
                      onClick={() => void handleEstadoPedido(cot.id, 'entregado')}
                      className="px-3.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium cursor-pointer disabled:opacity-50"
                    >
                      Confirmar Entrega
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
