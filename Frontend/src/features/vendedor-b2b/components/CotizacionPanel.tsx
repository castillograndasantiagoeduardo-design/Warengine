'use client';

/**
 * CotizacionPanel.tsx — Panel de pedido / cotización B2B.
 *
 * Facilita la selección de clientes corporativos, cálculo automático y
 * emisión directa sin requisito de turno de caja físico (RF-FMC-A6, B13).
 */

import React from 'react';
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
  subtotal: number;
  iva: number;
  total: number;
  onActualizarCantidad: (productoId: string, cantidad: number) => void;
  onRemoverItem: (productoId: string) => void;
  onLimpiar: () => void;
  onEmitirFactura: () => void;
  isSubmitting: boolean;
  errorFactura: string | null;
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
  subtotal,
  iva,
  total,
  onActualizarCantidad,
  onRemoverItem,
  onLimpiar,
  onEmitirFactura,
  isSubmitting,
  errorFactura,
}: CotizacionPanelProps) {
  return (
    <aside className="w-full lg:w-96 flex flex-col gap-4">
      {/* Sección Selección de Cliente Corporativo */}
      <div className="p-4 rounded-2xl bg-[#14213D] border border-white/10 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-[#E9B949] uppercase tracking-wider">
            Cliente Corporativo (B2B)
          </label>
          <button
            type="button"
            onClick={onAbrirModalNuevoCliente}
            className="text-[11px] text-[#E9B949] hover:underline cursor-pointer"
          >
            + Nuevo Cliente
          </button>
        </div>

        <select
          value={clienteSeleccionado?.id || ''}
          onChange={(e) => {
            const found = clientesDisponibles.find((c) => c.id === e.target.value);
            onSeleccionarCliente(found || null);
          }}
          className="w-full bg-[#0d1630] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E9B949] transition-colors cursor-pointer mb-2"
        >
          <option value="">-- Selecciona un cliente B2B --</option>
          {clientesDisponibles.map((cli) => (
            <option key={cli.id} value={cli.id}>
              {cli.nombreRazonSocial} ({cli.tipoDocumento}: {cli.numeroDocumento})
            </option>
          ))}
        </select>

        {clienteSeleccionado && (
          <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 text-[11px] space-y-1">
            <p className="text-white font-medium">{clienteSeleccionado.nombreRazonSocial}</p>
            <p className="text-white/60">
              {clienteSeleccionado.tipoDocumento}: {clienteSeleccionado.numeroDocumento} &bull; Tel: {clienteSeleccionado.telefono || 'N/A'}
            </p>
            <div className="pt-1 flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  clienteSeleccionado.creditoHabilitado
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {clienteSeleccionado.creditoHabilitado ? '✓ Crédito Autorizado' : 'Sin Cupo de Crédito'}
              </span>
            </div>
          </div>
        )}
      </div>

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
                Crédito Corp. (30d)
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
          </div>

          {/* Desglose de Totales */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-white/60">
              <span>Subtotal:</span>
              <span className="font-mono">${subtotal.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>IVA:</span>
              <span className="font-mono">${iva.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-white/10">
              <span>Total Comercial:</span>
              <span className="font-mono text-[#E9B949]">${total.toLocaleString('es-CO')}</span>
            </div>
          </div>

          {errorFactura && (
            <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-[11px]">
              {errorFactura}
            </div>
          )}

          {/* Botón de Despacho de Factura B2B */}
          <button
            type="button"
            disabled={isSubmitting || items.length === 0 || !clienteSeleccionado}
            onClick={onEmitirFactura}
            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg ${
              isSubmitting || items.length === 0 || !clienteSeleccionado
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#E9B949] to-[#b88a1f] hover:brightness-110 text-[#14213D]'
            }`}
          >
            {isSubmitting ? 'Emitiendo Factura...' : 'Emitir Factura B2B (Sin Turno)'}
          </button>
        </div>
      </div>
    </aside>
  );
}
