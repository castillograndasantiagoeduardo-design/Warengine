'use client';

/**
 * HistorialVentasB2BModal.tsx — Modal para consultar facturas emitidas.
 */

import React, { useState, useEffect } from 'react';
import { ModalVidrio } from './ModalVidrio';
import { Insignia } from '@/components/Insignia';
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

  return (
    <ModalVidrio
      open={isOpen}
      onClose={onClose}
      title="Historial de facturación corporativa"
      description="Registro de facturas emitidas y estado ante cartera"
      size="3xl"
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="superficie-control rounded-xl px-4 py-2 text-xs font-sans font-medium text-text hover:text-text-muted transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      }
    >
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="py-12 text-center text-text-muted font-mono text-xs">
            Cargando registros de facturación...
          </div>
        ) : facturas.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-xs font-sans">
            No se han emitido facturas aún.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider font-medium text-text-muted">
                <th className="py-2.5 px-3">Consecutivo</th>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Ítems</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => (
                <tr key={f.id} className="fila-tabla text-xs">
                  <td className="py-3 px-3 font-mono font-medium text-text">
                    #{f.consecutivo}
                  </td>
                  <td className="py-3 px-3 text-text-muted tabular-nums">
                    {new Date(f.fecha).toLocaleDateString('es-CO')}
                  </td>
                  <td className="py-3 px-3 text-text-muted tabular-nums">
                    {f.items?.length || 0} ítems
                  </td>
                  <td className="py-3 px-3 text-right font-titulos font-semibold text-text tabular-nums">
                    ${f.total.toLocaleString('es-CO')}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Insignia
                      variante={f.estado === 'emitida' ? 'success' : 'danger'}
                      conPunto
                      tamano="sm"
                    >
                      {f.estado === 'emitida' ? 'Emitida' : f.estado}
                    </Insignia>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ModalVidrio>
  );
}
