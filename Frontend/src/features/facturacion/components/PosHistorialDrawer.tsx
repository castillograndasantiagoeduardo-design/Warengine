'use client';

/**
 * PosHistorialDrawer.tsx — Panel lateral de historial de comprobantes del turno POS.
 */

import React, { useState, useEffect } from 'react';
import { posService } from '../api';
import type { FacturaDto } from '../types/pos.types';

interface PosHistorialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sucursalId: number;
  onSeleccionarParaReimprimir: (factura: FacturaDto) => void;
}

export function PosHistorialDrawer({
  isOpen,
  onClose,
  sucursalId,
  onSeleccionarParaReimprimir,
}: PosHistorialDrawerProps) {
  const [facturas, setFacturas] = useState<FacturaDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const formatoCOP = (monto: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(monto);

  useEffect(() => {
    if (!isOpen) return;

    let cancelado = false;
    async function cargarFacturas() {
      setIsLoading(true);
      try {
        const data = await posService.listarFacturas({
          sucursalId,
          limite: 30,
        });
        if (!cancelado) setFacturas(data);
      } catch {
        if (!cancelado) setFacturas([]);
      } finally {
        if (!cancelado) setIsLoading(false);
      }
    }

    cargarFacturas();
    return () => {
      cancelado = true;
    };
  }, [isOpen, sucursalId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs select-none">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0a1124] border-l border-white/10 p-5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
          {/* Cabecera */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📜</span>
              <div>
                <h3 className="font-[family-name:var(--font-anton)] text-[#e3b341] text-lg tracking-wider uppercase">
                  Comprobantes Emitidos
                </h3>
                <p className="text-xs text-white/50">Últimas transacciones registradas</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/40 hover:text-white text-lg p-1 cursor-pointer"
            >
              &times;
            </button>
          </div>

          {/* Lista de facturas */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-white/40 font-[family-name:var(--font-pixelify)]">
                Cargando historial de caja...
              </div>
            ) : facturas.length === 0 ? (
              <div className="py-12 text-center text-xs text-white/40">
                No hay comprobantes registrados aún en este turno.
              </div>
            ) : (
              facturas.map((fac) => (
                <div
                  key={fac.id}
                  className="p-3 rounded-xl bg-[#0f1b3d] border border-white/5 hover:border-white/20 transition-all space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-xs text-[#e3b341]">
                        #FAC-{String(fac.consecutivo).padStart(5, '0')}
                      </span>
                      <p className="text-[10px] text-white/50">
                        {fac.fecha ? new Date(fac.fecha).toLocaleTimeString('es-CO') : '—'}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase font-[family-name:var(--font-pixelify)] ${
                        fac.estado === 'emitida'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {fac.estado}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline pt-1 border-t border-white/5">
                    <span className="text-[11px] text-white/60">
                      {fac.items?.length || 0} artículo(s)
                    </span>
                    <span className="font-[family-name:var(--font-anton)] text-white text-base tracking-wide">
                      {formatoCOP(fac.total)}
                    </span>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => onSeleccionarParaReimprimir(fac)}
                      className="px-2.5 py-1 rounded-lg bg-[#14213D] hover:bg-[#1a2b50] border border-white/10 text-white/80 hover:text-[#e3b341] text-[10px] font-[family-name:var(--font-pixelify)] uppercase cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <span>🖨️</span>
                      <span>Ver / Reimprimir</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
