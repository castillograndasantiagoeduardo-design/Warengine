'use client';

/**
 * BranchCotizacionesB2BPanel.tsx — Gestión de avales de cotizaciones B2B y pedidos en proceso
 * para el Administrador de Sucursal.
 *
 * Muestra el detalle exacto de los productos solicitados y verifica la disponibilidad real
 * en el inventario de la bodega. Bloquea el aval si el stock es insuficiente y permite rechazar
 * la cotización con justificación automática de los faltantes.
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
  const [itemsExpandidos, setItemsExpandidos] = useState<Record<string, boolean>>({});

  const cargar = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<CotizacionB2BDto[]>('/ventas/cotizaciones-b2b', {
        params: { sucursalId, limite: 50 },
      });
      const lista = Array.isArray(data) ? data : [];
      setCotizaciones(lista);

      // Expandir por defecto las que están pendientes de aval para revisión inmediata
      const abiertos: Record<string, boolean> = {};
      for (const c of lista) {
        if (c.estado === 'pendiente_aval') {
          abiertos[c.id] = true;
        }
      }
      setItemsExpandidos((prev) => ({ ...abiertos, ...prev }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las cotizaciones B2B.');
    } finally {
      setIsLoading(false);
    }
  }, [sucursalId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const toggleItems = (id: string) => {
    setItemsExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAvalar = async (cot: CotizacionB2BDto) => {
    const tieneStock =
      cot.tieneStockSuficiente ??
      cot.items.every((i) => (i.stockBodegaActual ?? 0) >= i.cantidad);

    if (!tieneStock) {
      setError(
        'No se puede dar aval comercial: hay productos con stock insuficiente en la bodega. Debes rechazar la cotización.',
      );
      return;
    }

    setProcesandoId(cot.id);
    setError(null);
    try {
      await apiClient.put(`/ventas/cotizaciones-b2b/${cot.id}/avalar`);
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

  const autocompletarRechazoPorStock = (cot: CotizacionB2BDto) => {
    const faltantes = cot.items.filter((i) => (i.stockBodegaActual ?? 0) < i.cantidad);
    const detalle = faltantes
      .map(
        (i) =>
          `${i.productoSku || i.productoNombre || 'Producto'} (solicitados: ${i.cantidad}, en bodega: ${i.stockBodegaActual ?? 0})`,
      )
      .join(', ');
    setMotivoRechazo(`Stock insuficiente en bodega: ${detalle}.`);
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
            Verifica qué pidió el vendedor, revisa el stock en bodega y aprueba o rechaza cada cotización.
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
            const tieneStock =
              cot.tieneStockSuficiente ??
              cot.items.every((i) => (i.stockBodegaActual ?? 0) >= i.cantidad);
            const itemsFaltantes = cot.items.filter(
              (i) => (i.stockBodegaActual ?? 0) < i.cantidad,
            );
            const expandido = itemsExpandidos[cot.id] ?? false;

            return (
              <div
                key={cot.id}
                className="p-4 rounded-xl superficie-control border border-border space-y-3 text-xs"
              >
                {/* Cabecera de la cotización */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-semibold text-brand-300">
                      COT-{String(cot.consecutivo).padStart(4, '0')}
                    </span>
                    <span className="mx-2 text-text-muted">•</span>
                    <span className="font-medium text-text">
                      {cot.clienteNombre || cot.clienteId}
                    </span>
                    {cot.clienteDocumento && (
                      <span className="ml-1.5 text-[11px] text-text-muted font-mono">
                        ({cot.clienteDocumento})
                      </span>
                    )}
                    {cot.vendedorEmail && (
                      <span className="ml-2 text-text-muted">· Vendedor: {cot.vendedorEmail}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {cot.estado === 'pendiente_aval' && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          tieneStock
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-red-500/15 text-red-300 border-red-500/30'
                        }`}
                      >
                        {tieneStock ? '✓ Stock en bodega OK' : '✕ Stock insuficiente'}
                      </span>
                    )}
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

                {/* Resumen comercial */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-text-muted">
                  <div className="flex items-center gap-2">
                    <span>
                      {cot.items.length} producto(s) • Pago: <strong>{cot.medioPagoSugerido}</strong> • Válida hasta{' '}
                      {new Date(cot.validaHasta).toLocaleDateString('es-CO')}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleItems(cot.id)}
                      className="text-[11px] text-brand-300 hover:underline cursor-pointer"
                    >
                      {expandido ? 'Ocultar productos' : 'Ver productos pedidos'}
                    </button>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-text">
                    ${cot.total.toLocaleString('es-CO')} COP
                  </span>
                </div>

                {cot.observaciones && (
                  <p className="text-[11px] text-text-muted italic">
                    Nota del vendedor: {cot.observaciones}
                  </p>
                )}

                {/* Alerta de stock insuficiente si está pendiente de aval */}
                {cot.estado === 'pendiente_aval' && !tieneStock && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                    <span className="text-base leading-none">⚠</span>
                    <div>
                      <p className="font-semibold text-red-200">
                        Stock insuficiente en bodega para cumplir esta cotización.
                      </p>
                      <p className="text-[11px] text-red-300/90 mt-0.5">
                        {itemsFaltantes.length} producto(s) no tienen existencias suficientes en esta sede.
                        No se permite otorgar el aval; debes rechazar la cotización indicando el motivo al vendedor.
                      </p>
                    </div>
                  </div>
                )}

                {/* Detalle de productos pedidos y stock en bodega */}
                {expandido && (
                  <div className="rounded-xl bg-bg/50 border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between border-b border-border pb-1.5">
                      <span className="text-[11px] font-semibold text-text uppercase tracking-wider">
                        Productos pedidos ({cot.items.length})
                      </span>
                      <span className="text-[10px] text-text-muted">
                        Stock disponible en esta bodega
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {cot.items.map((item) => {
                        const stockActual = item.stockBodegaActual ?? 0;
                        const ok =
                          item.tieneStockSuficiente ?? stockActual >= item.cantidad;
                        const faltante = Math.max(0, item.cantidad - stockActual);

                        return (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-2 ${
                              ok
                                ? 'bg-white/[0.02] border-white/5'
                                : 'bg-red-500/10 border-red-500/30'
                            }`}
                          >
                            <div className="flex-1 min-w-[200px]">
                              <p className="font-medium text-text">
                                {item.productoNombre || 'Producto sin nombre'}
                              </p>
                              <p className="text-[10px] text-text-muted font-mono">
                                SKU: {item.productoSku || 'N/D'} · Pedido: {item.cantidad} u. a $
                                {item.precioUnitario.toLocaleString('es-CO')}
                              </p>
                            </div>

                            {/* Badge de stock de este producto */}
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                  ok
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    : 'bg-red-500/20 text-red-300 border-red-500/40'
                                }`}
                              >
                                {ok
                                  ? `✓ Bodega: ${stockActual} disp.`
                                  : `✕ Bodega: ${stockActual} disp. (Faltan ${faltante})`}
                              </span>

                              <span className="font-mono text-xs font-semibold tabular-nums text-text">
                                ${item.subtotal.toLocaleString('es-CO')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Motivo de rechazo registrado si la cotización ya fue rechazada */}
                {cot.estado === 'rechazada' && cot.motivoRechazo && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-200 text-[11px]">
                    <strong>Motivo del rechazo:</strong> {cot.motivoRechazo}
                  </div>
                )}

                {/* Acciones de aval o rechazo para cotizaciones en pendiente_aval */}
                {cot.estado === 'pendiente_aval' && (
                  <div className="pt-2 border-t border-border space-y-2">
                    {rechazoId === cot.id ? (
                      <div className="space-y-2 bg-red-500/5 p-3 rounded-xl border border-red-500/20">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-medium text-red-200">
                            Motivo del rechazo de la cotización:
                          </label>
                          {!tieneStock && itemsFaltantes.length > 0 && (
                            <button
                              type="button"
                              onClick={() => autocompletarRechazoPorStock(cot)}
                              className="text-[10px] text-brand-300 hover:underline cursor-pointer"
                            >
                              Copiar motivo por falta de stock
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={motivoRechazo}
                          onChange={(e) => setMotivoRechazo(e.target.value)}
                          placeholder="Escribe el motivo del rechazo (mín. 5 caracteres)..."
                          className="w-full px-3 py-1.5 rounded-lg superficie-control border border-border text-xs text-text"
                        />
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setRechazoId(null);
                              setMotivoRechazo('');
                            }}
                            className="px-3 py-1.5 rounded-lg border border-border text-xs text-text-muted hover:text-text cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={ocupada || motivoRechazo.trim().length < 5}
                            onClick={() => void handleConfirmarRechazo(cot.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium cursor-pointer disabled:opacity-50"
                          >
                            {ocupada ? 'Rechazando...' : 'Confirmar rechazo'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={ocupada}
                          onClick={() => {
                            setRechazoId(cot.id);
                            if (!tieneStock) autocompletarRechazoPorStock(cot);
                          }}
                          className="px-3.5 py-1.5 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/15 text-xs font-medium cursor-pointer disabled:opacity-50"
                        >
                          Rechazar cotización
                        </button>
                        <button
                          type="button"
                          disabled={ocupada || !tieneStock}
                          title={
                            !tieneStock
                              ? 'No es posible otorgar el aval comercial con stock insuficiente en bodega'
                              : 'Otorgar aval comercial para que el vendedor B2B pueda facturar'
                          }
                          onClick={() => void handleAvalar(cot)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            !tieneStock
                              ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                              : 'bg-brand-600 hover:bg-brand-500 text-btn-primario-texto cursor-pointer'
                          }`}
                        >
                          {ocupada ? 'Aprobando...' : 'Dar Aval'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Ciclo del pedido facturado */}
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
