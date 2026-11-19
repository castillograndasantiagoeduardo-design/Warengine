'use client';

/**
 * BranchKardexModal.tsx — Visor y auditoría del historial de movimientos Kardex (RF-ADM-B10).
 * Migrado a Modal.tsx para accesibilidad y diseño unificado.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import type {
  ProductoInventarioSede,
  MovimientoKardexItem,
  FiltrosKardexDTO,
} from '../types/branch-inventory.types';

interface BranchKardexModalProps {
  isOpen: boolean;
  sucursalId: number;
  sucursalNombre: string;
  productos: ProductoInventarioSede[];
  productoInicial?: ProductoInventarioSede | null;
  onClose: () => void;
  onConsultarKardex: (filtros: FiltrosKardexDTO) => Promise<any>;
  onExportarCsv: (filtros?: any) => Promise<void>;
  isLoading: boolean;
  movimientos: MovimientoKardexItem[];
}

export function BranchKardexModal({
  isOpen,
  sucursalId,
  sucursalNombre,
  productos,
  productoInicial,
  onClose,
  onConsultarKardex,
  onExportarCsv,
  isLoading,
  movimientos,
}: BranchKardexModalProps) {
  const [productoFiltro, setProductoFiltro] = useState<string>('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');

  useEffect(() => {
    if (isOpen) {
      const prodId = productoInicial ? productoInicial.id : '';
      setProductoFiltro(prodId);
      setTipoFiltro('todos');
      onConsultarKardex({
        sucursalId,
        productoId: prodId || undefined,
        limit: 50,
      });
    }
  }, [isOpen, productoInicial, sucursalId, onConsultarKardex]);

  const handleFiltrar = (tipo?: string, prodId?: string) => {
    const t = tipo !== undefined ? tipo : tipoFiltro;
    const p = prodId !== undefined ? prodId : productoFiltro;

    onConsultarKardex({
      sucursalId,
      productoId: p || undefined,
      tipo: t !== 'todos' ? (t as any) : undefined,
      limit: 50,
    });
  };

  const handleDescargarCsv = () => {
    onExportarCsv({
      sucursalId,
      productoId: productoFiltro || undefined,
      tipo: tipoFiltro !== 'todos' ? tipoFiltro : undefined,
    });
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Historial de Movimientos Kardex"
      description={`Trazabilidad inmutable de almacén en ${sucursalNombre} (RF-ADM-B10)`}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={handleDescargarCsv}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
          >
            <span>📥</span>
            <span>Descargar CSV</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-3 border-b border-white/5">
          <div className="sm:col-span-6">
            <select
              value={productoFiltro}
              onChange={(e) => {
                setProductoFiltro(e.target.value);
                handleFiltrar(undefined, e.target.value);
              }}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="">Todos los productos de la sede</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-6">
            <select
              value={tipoFiltro}
              onChange={(e) => {
                setTipoFiltro(e.target.value);
                handleFiltrar(e.target.value, undefined);
              }}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="todos">Todos los tipos de movimiento</option>
              <option value="entrada">Entradas</option>
              <option value="salida">Salidas</option>
              <option value="ajuste_positivo">Ajustes (+)</option>
              <option value="ajuste_negativo">Ajustes (-)</option>
              <option value="venta">Ventas POS</option>
              <option value="devolucion">Devoluciones</option>
            </select>
          </div>
        </div>

        {/* Tabla Kardex */}
        {isLoading ? (
          <div className="space-y-2 py-8">
            <div className="h-6 bg-white/5 rounded animate-pulse w-full" />
            <div className="h-6 bg-white/5 rounded animate-pulse w-4/5" />
            <div className="h-6 bg-white/5 rounded animate-pulse w-3/4" />
          </div>
        ) : movimientos.length === 0 ? (
          <div className="py-12 text-center text-white/50 text-xs">
            No se encontraron movimientos registrados para este criterio de búsqueda.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[50vh]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-[#0d0914] z-10">
                <tr className="border-b border-white/10 text-white/50 text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Fecha / Hora</th>
                  <th className="py-2.5 px-3">Producto</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3 text-right">Cantidad</th>
                  <th className="py-2.5 px-3 text-right">Saldo</th>
                  <th className="py-2.5 px-3">Motivo / Documento</th>
                  <th className="py-2.5 px-3">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {movimientos.map((m) => {
                  const isPositive = m.cantidad > 0;
                  return (
                    <tr key={m.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 text-white/60 whitespace-nowrap">
                        {new Date(m.fecha).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white">
                          {m.productoNombre || `ID: ${m.productoId}`}
                        </div>
                        {m.productoSku && (
                          <div className="text-[10px] font-mono text-white/40">
                            {m.productoSku}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-white/5 text-white/80 border border-white/10">
                          {m.tipo.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
                          {isPositive ? `+${m.cantidad}` : m.cantidad}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-white/70 tabular-nums">
                        {m.stockResultante !== undefined ? m.stockResultante : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-white/70 max-w-xs truncate">
                        {m.motivo || (m.facturaId ? `Factura #${m.facturaId}` : '-')}
                      </td>
                      <td className="py-2.5 px-3 text-white/60">
                        {m.usuarioNombre || (m.usuarioId ? `Usuario #${m.usuarioId}` : '-')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
