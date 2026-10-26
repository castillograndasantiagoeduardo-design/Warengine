'use client';

/**
 * PosCarrito.tsx — Panel de carrito y resumen de la orden de venta activa del POS.
 */

import React from 'react';
import type { ItemCarritoPos, ClienteDto } from '../types/pos.types';

interface PosCarritoProps {
  items: ItemCarritoPos[];
  totales: {
    subtotal: number;
    iva: number;
    total: number;
    cantidadItems: number;
    tieneItems: boolean;
  };
  /** null hasta que el cajero busque o cree el cliente de la venta. */
  cliente: ClienteDto | null;
  tieneTurnoAbierto: boolean;
  onActualizarCantidad: (productoId: string, cantidad: number) => void;
  onEliminarItem: (productoId: string) => void;
  onLimpiarCarrito: () => void;
  onAbrirModalCliente: () => void;
  onIniciarCobro: () => void;
}

export function PosCarrito({
  items,
  totales,
  cliente,
  tieneTurnoAbierto,
  onActualizarCantidad,
  onEliminarItem,
  onLimpiarCarrito,
  onAbrirModalCliente,
  onIniciarCobro,
}: PosCarritoProps) {
  const formatoCOP = (monto: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(monto);

  return (
    <aside className="w-96 flex flex-col h-full bg-[#0a1124] border-l border-white/10 select-none">
      {/* 1. Selector de Cliente */}
      <div className="p-3.5 border-b border-white/10 bg-[#0f1b3d]/50">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider font-[family-name:var(--font-ui)]">
            Cliente Asignado
          </span>
          <button
            onClick={onAbrirModalCliente}
            className="text-[11px] text-[#e3b341] hover:underline cursor-pointer flex items-center gap-1 font-[family-name:var(--font-ui)]"
          >
            <span>Cambiar / Crear</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div className="p-2.5 rounded-xl bg-[#0a1124] border border-white/10 flex items-center justify-between">
          {cliente ? (
          <div className="truncate mr-2">
            <h5 className="text-xs font-semibold text-white truncate">
              {cliente.nombreRazonSocial}
            </h5>
            <p className="text-[11px] text-white/50 font-mono">
              {cliente.tipoDocumento}: {cliente.numeroDocumento}
              {cliente.tipoCliente === 'B2B' && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                  B2B
                </span>
              )}
            </p>
          </div>
          ) : (
          <button type="button" onClick={onAbrirModalCliente} className="truncate mr-2 text-left cursor-pointer">
            <h5 className="text-xs font-semibold text-amber-300">Sin cliente seleccionado</h5>
            <p className="text-[11px] text-white/50">Busca o registra el cliente para poder cobrar</p>
          </button>
          )}
          <span className="w-7 h-7 rounded-lg bg-[#14213D] flex items-center justify-center text-xs">
            👤
          </span>
        </div>
      </div>

      {/* 2. Lista de Ítems en Carrito */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-white/50 pb-1 border-b border-white/5">
          <span>Detalle de Artículos ({totales.cantidadItems})</span>
          {totales.tieneItems && (
            <button
              onClick={onLimpiarCarrito}
              className="text-[10px] text-red-400 hover:text-red-300 hover:underline cursor-pointer"
            >
              Vaciar Ticket
            </button>
          )}
        </div>

        {!totales.tieneItems ? (
          <div className="h-48 flex flex-col items-center justify-center text-white/30 text-center">
            <span className="text-3xl mb-1.5">🛒</span>
            <p className="text-xs font-medium">Ticket de venta vacío</p>
            <p className="text-[11px] text-white/30 mt-0.5">
              Escanea o haz clic en los productos para agregarlos.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.productoId}
              className="p-2.5 rounded-xl bg-[#0f1b3d] border border-white/5 flex flex-col gap-1.5"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="truncate">
                  <h6 className="text-xs font-medium text-white truncate leading-tight">
                    {item.nombre}
                  </h6>
                  <span className="text-[10px] text-white/40 font-mono">{item.sku}</span>
                </div>
                <button
                  onClick={() => onEliminarItem(item.productoId)}
                  className="text-white/40 hover:text-red-400 text-xs px-1 cursor-pointer"
                  title="Eliminar de la orden"
                >
                  &times;
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                {/* Controles de cantidad */}
                <div className="flex items-center gap-1 bg-[#0a1124] rounded-lg p-0.5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => onActualizarCantidad(item.productoId, item.cantidad - 1)}
                    className="w-5 h-5 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/10 text-xs cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-bold text-xs text-white">
                    {item.cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={() => onActualizarCantidad(item.productoId, item.cantidad + 1)}
                    className="w-5 h-5 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/10 text-xs cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal del ítem */}
                <div className="text-right">
                  <span className="text-[10px] text-white/40 block leading-none">
                    {formatoCOP(item.precioUnitario)} c/u
                  </span>
                  <span className="font-[family-name:var(--font-anton)] text-[#e3b341] text-sm tracking-wide">
                    {formatoCOP(item.subtotal)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Panel Inferior: Totales y Botón de Cobro */}
      <div className="p-4 bg-[#0d1630] border-t border-white/10 space-y-3">
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-white/60">
            <span>Subtotal</span>
            <span className="font-medium text-white">{formatoCOP(totales.subtotal)}</span>
          </div>
          <div className="flex justify-between text-white/60">
            <span>IVA</span>
            <span className="font-medium text-white">{formatoCOP(totales.iva)}</span>
          </div>
        </div>

        {/* Caja de Total Monumental */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-[#14213d] to-[#0a1124] border border-[#e3b341]/30 flex items-baseline justify-between shadow-inner">
          <span className="text-xs uppercase font-bold text-white/70 font-[family-name:var(--font-ui)] tracking-wider">
            Total a Pagar
          </span>
          <span className="font-[family-name:var(--font-anton)] text-3xl text-[#e3b341] tracking-wider leading-none">
            {formatoCOP(totales.total)}
          </span>
        </div>

        {/* Botón 3D de Cobro */}
        <button
          type="button"
          onClick={onIniciarCobro}
          disabled={!totales.tieneItems || !tieneTurnoAbierto || !cliente}
          className={`w-full py-3.5 rounded-2xl font-[family-name:var(--font-ui)] text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
            !tieneTurnoAbierto
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-not-allowed'
              : !totales.tieneItems || !cliente
              ? 'bg-white/10 text-white/40 border border-white/5 cursor-not-allowed'
              : 'bg-[#e3b341] hover:bg-[#e9b949] text-black shadow-[0_4px_0_#b88a1f] active:translate-y-1 active:shadow-none hover:shadow-[0_4px_16px_rgba(227,179,65,0.4)]'
          }`}
        >
          <span>💳</span>
          <span>{!tieneTurnoAbierto ? 'Abre Turno para Cobrar' : !cliente ? 'Selecciona un Cliente' : 'Cobrar Orden (F4)'}</span>
        </button>
      </div>
    </aside>
  );
}
