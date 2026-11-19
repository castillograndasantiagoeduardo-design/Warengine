'use client';

/**
 * CotizacionPanel.tsx — Panel de pedido / cotización B2B.
 *
 * Facilita la selección de clientes corporativos, cálculo automático y
 * emisión directa sin requisito de turno de caja físico (RF-FMC-A6, B13).
 */

import React from 'react';
import { UserPlus, RefreshCw } from 'lucide-react';
import { Tarjeta } from '@/components/Tarjeta';
import { Insignia } from '@/components/Insignia';
import type {
  ItemCotizacionB2B,
  ClienteDto,
  MedioPago,
} from '../types';

interface CotizacionPanelProps {
  items: ItemCotizacionB2B[];
  clienteSeleccionado: ClienteDto | null;
  clientesDisponibles: ClienteDto[];
  onSeleccionarCliente: (cliente: ClienteDto | null) => void;
  onAbrirModalNuevoCliente: () => void;
  medioPago: MedioPago;
  setMedioPago: (medio: MedioPago) => void;
  referenciaPago: string;
  setReferenciaPago: (ref: string) => void;
  observaciones?: string;
  setObservaciones?: (obs: string) => void;
  subtotal: number;
  iva: number;
  total: number;
  onActualizarCantidad: (productoId: string, cantidad: number) => void;
  onRemoverItem: (productoId: string) => void;
  onLimpiar: () => void;
  onEnviarCotizacion: () => void;
  isSubmitting: boolean;
  errorFactura: string | null;
  onRefrescarClientes?: () => void;
  isRefreshingClientes?: boolean;
}

export function CotizacionPanel({
  items,
  clienteSeleccionado,
  clientesDisponibles,
  onSeleccionarCliente,
  onAbrirModalNuevoCliente,
  medioPago,
  setMedioPago,
  referenciaPago,
  setReferenciaPago,
  observaciones = '',
  setObservaciones,
  subtotal,
  iva,
  total,
  onActualizarCantidad,
  onRemoverItem,
  onLimpiar,
  onEnviarCotizacion,
  isSubmitting,
  errorFactura,
  onRefrescarClientes,
  isRefreshingClientes = false,
}: CotizacionPanelProps) {
  const excedeCupoDisponible =
    medioPago === 'credito_corporativo' &&
    Boolean(clienteSeleccionado?.creditoHabilitado) &&
    (clienteSeleccionado?.cupoCreditoAprobado ?? 0) > 0 &&
    total > (clienteSeleccionado?.cupoCreditoDisponible ?? 0);
  return (
    <aside className="w-full flex flex-col gap-4">
      {/* Sección Selección de Cliente Corporativo */}
      <Tarjeta
        titulo="Cliente corporativo (B2B)"
        accion={
          <button
            type="button"
            onClick={onAbrirModalNuevoCliente}
            className="text-xs font-sans font-medium text-brand-500 hover:text-brand-400 transition-colors cursor-pointer flex items-center gap-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Nuevo cliente</span>
          </button>
        }
        className="hover:translate-y-0"
      >
        <select
          value={clienteSeleccionado?.id || ''}
          onChange={(e) => {
            const found = clientesDisponibles.find((c) => c.id === e.target.value);
            onSeleccionarCliente(found || null);
          }}
          className="w-full superficie-control rounded-xl px-3 py-2 text-xs text-text focus:outline-none cursor-pointer mb-2.5"
        >
          <option value="" className="bg-bg text-text">-- Selecciona un cliente B2B --</option>
          {clientesDisponibles.map((cli) => (
            <option key={cli.id} value={cli.id} className="bg-bg text-text">
              {cli.nombreRazonSocial} ({cli.tipoDocumento}: {cli.numeroDocumento})
            </option>
          ))}
        </select>

        {clienteSeleccionado && (
          <div className="p-3 rounded-xl superficie-control text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-text font-medium truncate">{clienteSeleccionado.nombreRazonSocial}</p>
              <span className="font-mono text-[11px] text-text-muted shrink-0">
                {clienteSeleccionado.tipoDocumento}: {clienteSeleccionado.numeroDocumento}
              </span>
            </div>
            <p className="text-xs text-text-muted">
              Tel: <span className="tabular-nums">{clienteSeleccionado.telefono || 'N/A'}</span>
            </p>
            <div className="pt-1.5 flex flex-wrap items-center justify-between gap-2 border-t border-border">
              <Insignia
                variante={
                  clienteSeleccionado.creditoHabilitado
                    ? 'success'
                    : clienteSeleccionado.estadoCredito === 'pendiente_aprobacion'
                    ? 'info'
                    : clienteSeleccionado.estadoCredito === 'rechazado'
                    ? 'danger'
                    : 'warning'
                }
                conPunto
                tamano="sm"
              >
                {clienteSeleccionado.creditoHabilitado
                  ? `Crédito liberado${
                      (clienteSeleccionado.cupoCreditoAprobado ?? 0) > 0
                        ? ` ($${(clienteSeleccionado.cupoCreditoDisponible ?? 0).toLocaleString('es-CO')} disp.)`
                        : ''
                    }`
                  : clienteSeleccionado.estadoCredito === 'pendiente_aprobacion'
                  ? `En revisión Super Admin (Sug: $${(clienteSeleccionado.cupoCreditoSugerido ?? 0).toLocaleString('es-CO')})`
                  : clienteSeleccionado.estadoCredito === 'rechazado'
                  ? 'Crédito rechazado'
                  : 'Sin cupo de crédito'}
              </Insignia>
              {onRefrescarClientes && (
                <button
                  type="button"
                  disabled={isRefreshingClientes}
                  onClick={onRefrescarClientes}
                  className="text-[11px] text-brand-500 hover:text-brand-400 font-sans font-medium hover:underline cursor-pointer disabled:opacity-50 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingClientes ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingClientes ? 'Actualizando...' : 'Actualizar cupo'}</span>
                </button>
              )}
            </div>
            {clienteSeleccionado.estadoCredito === 'rechazado' &&
              clienteSeleccionado.motivoDecisionCredito && (
                <p className="text-[11px] text-red-600 dark:text-red-400 font-sans mt-1">
                  Motivo: {clienteSeleccionado.motivoDecisionCredito}
                </p>
              )}
          </div>
        )}
      </Tarjeta>

      {/* Carrito / Lista de Ítems */}
      <div className="p-4 rounded-2xl bg-[#14213D] border border-white/10 shadow-lg flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
            <h2 className="text-xs font-bold text-[#E9B949] uppercase tracking-wider">
              Orden Comercial ({items.length})
            </h2>
            {items.length > 0 && (
              <button
                type="button"
                onClick={onLimpiar}
                className="text-[10px] text-red-300 hover:underline cursor-pointer"
              >
                Vaciar orden
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/40">
              No hay productos en la orden comercial. Selecciona ítems del catálogo.
            </div>
          ) : (
            <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
              {items.map((item) => (
                <div
                  key={item.productoId}
                  className="p-2.5 rounded-xl bg-[#0d1630] border border-white/5 text-xs flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{item.nombre}</p>
                    <p className="text-[10px] text-white/50">
                      ${item.precioUnitario.toLocaleString('es-CO')} c/u
                    </p>
                  </div>

                  {/* Controles de cantidad */}
                  <div className="flex items-center gap-1 bg-[#14213D] rounded-lg border border-white/10 px-1 py-0.5">
                    <button
                      type="button"
                      onClick={() => onActualizarCantidad(item.productoId, item.cantidad - 1)}
                      className="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-mono text-white text-[11px]">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => onActualizarCantidad(item.productoId, item.cantidad + 1)}
                      className="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white"
                    >
                      +
                    </button>
                  </div>

                  <span className="font-mono text-xs font-bold text-[#E9B949]">
                    ${item.subtotal.toLocaleString('es-CO')}
                  </span>

                  <button
                    type="button"
                    onClick={() => onRemoverItem(item.productoId)}
                    className="text-red-400 hover:text-red-300 text-xs px-1"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medio de Pago y Totales */}
        <div className="pt-3 border-t border-white/10 mt-3 space-y-3">
          {/* Selector de Medio de Pago Corporativo */}
          <div>
            <label className="text-[10px] text-white/60 block uppercase mb-1">
              Condición / Medio de Pago
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMedioPago('credito_corporativo')}
                disabled={!clienteSeleccionado?.creditoHabilitado}
                title={
                  clienteSeleccionado?.creditoHabilitado
                    ? undefined
                    : 'El cliente no tiene crédito corporativo habilitado por un administrador'
                }
                className={`disabled:opacity-40 disabled:cursor-not-allowed py-1.5 px-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                  medioPago === 'credito_corporativo'
                    ? 'border-[#E9B949] bg-[#E9B949]/20 text-[#E9B949]'
                    : 'border-white/10 text-white/70 hover:bg-white/5'
                }`}
              >
                Crédito Corp. ({clienteSeleccionado?.plazoCreditoDias ?? 30}d)
              </button>

              <button
                type="button"
                onClick={() => setMedioPago('transferencia')}
                className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                  medioPago === 'transferencia'
                    ? 'border-[#E9B949] bg-[#E9B949]/20 text-[#E9B949]'
                    : 'border-white/10 text-white/70 hover:bg-white/5'
                }`}
              >
                Transferencia
              </button>
            </div>

            {medioPago === 'transferencia' && (
              <input
                type="text"
                placeholder="Número de comprobante o referencia bancaria..."
                value={referenciaPago}
                onChange={(e) => setReferenciaPago(e.target.value)}
                className="w-full mt-2 bg-[#0d1630] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#E9B949]"
              />
            )}
            {setObservaciones && (
              <input
                type="text"
                placeholder="Observaciones para el Admin de Sucursal (opcional)..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full mt-2 bg-[#0d1630] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#E9B949]"
              />
            )}
          </div>

          {/* Desglose de Totales */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-white/60">
              <span>Subtotal:</span>
              <span className="tabular-nums">${subtotal.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>IVA:</span>
              <span className="tabular-nums">${iva.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-white pt-1 border-t border-white/10">
              <span>Total Cotizado:</span>
              <span className="tabular-nums text-[#E9B949]">${total.toLocaleString('es-CO')}</span>
            </div>
          </div>

          {excedeCupoDisponible && (
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[11px]">
              El total supera el cupo de crédito disponible ($
              {(clienteSeleccionado?.cupoCreditoDisponible ?? 0).toLocaleString('es-CO')} COP). Ajusta los productos o selecciona Transferencia.
            </div>
          )}

          {errorFactura && (
            <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-[11px]">
              {errorFactura}
            </div>
          )}

          {/* Botón Modo A: Enviar Cotización a Aval del Admin de Sucursal */}
          <button
            type="button"
            disabled={isSubmitting || items.length === 0 || !clienteSeleccionado || excedeCupoDisponible}
            onClick={onEnviarCotizacion}
            className={`w-full py-3 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg ${
              isSubmitting || items.length === 0 || !clienteSeleccionado || excedeCupoDisponible
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#E9B949] to-[#b88a1f] hover:brightness-110 text-[#14213D]'
            }`}
          >
            {isSubmitting ? 'Enviando Cotización...' : 'Enviar Cotización a Aval'}
          </button>
          <p className="text-[10px] text-center text-white/50">
            El Admin de Sucursal debe dar el aval antes de poder facturar y pasar a pedido en proceso.
          </p>
        </div>
      </div>
    </aside>
  );
}
