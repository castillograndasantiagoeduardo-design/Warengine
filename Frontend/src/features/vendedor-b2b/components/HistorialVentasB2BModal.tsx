'use client';

/**
 * HistorialVentasB2BModal.tsx — Modal para consultar facturas emitidas.
 */

import React, { useState, useEffect } from 'react';
import type { FacturaDto } from '../types';
import { vendedorB2bService } from '../api';

interface HistorialVentasB2BModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistorialVentasB2BModal({ isOpen, onClose }: HistorialVentasB2BModalProps) {
  const [facturas, setFacturas] = useState<FacturaDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      vendedorB2bService
        .listarFacturasB2B(30)
        .then(setFacturas)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-[#14213D] border border-white/10 rounded-2xl shadow-2xl p-6 text-white text-xs max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div>
            <h2 className="text-base font-bold text-[#E9B949] uppercase tracking-wider">
              Historial de Facturación Corporativa
            </h2>
            <p className="text-white/60 text-[11px]">
              Registro de facturas emitidas y estado ante cartera
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white text-lg font-bold"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="py-12 text-center text-[#E9B949] font-mono">
              Cargando registros de facturación...
            </div>
          ) : facturas.length === 0 ? (
            <div className="py-12 text-center text-white/50">
              No se han emitido facturas aún.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-[10px] uppercase">
                  <th className="py-2 px-2.5">Consecutivo</th>
                  <th className="py-2 px-2.5">Fecha</th>
                  <th className="py-2 px-2.5">Ítems</th>
                  <th className="py-2 px-2.5 text-right">Total</th>
                  <th className="py-2 px-2.5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {facturas.map((f) => (
                  <tr key={f.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-2.5 font-mono text-[#E9B949]">
                      #{f.consecutivo}
                    </td>
                    <td className="py-2.5 px-2.5 text-white/70">
                      {new Date(f.fecha).toLocaleDateString('es-CO')}
                    </td>
                    <td className="py-2.5 px-2.5 text-white/80">
                      {f.items?.length || 0} ítems
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono font-bold text-white">
                      ${f.total.toLocaleString('es-CO')}
                    </td>
                    <td className="py-2.5 px-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          f.estado === 'emitida'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {f.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
