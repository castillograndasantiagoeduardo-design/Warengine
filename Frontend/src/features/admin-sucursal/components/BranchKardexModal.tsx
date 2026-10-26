'use client';

/**
 * BranchKardexModal.tsx — Visor y auditoría del historial de movimientos Kardex (RF-ADM-B10).
 * 
 * Principios SOLID:
 * - Single Responsibility Principle (SRP): Consulta, filtrado y exportación de trazabilidad de stock.
 * - Dependency Inversion Principle (DIP): Se nutre de useInventoryMovements.
 */

import React, { useState, useEffect } from 'react';
import { Button3D } from '@/components/ui/Button3D';
import { RefreshCwIcon, SearchIcon, BoxesIcon } from './Icons';
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

  if (!isOpen) return null;

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

  const formatearFecha = (fecha: string | Date) => {
    const d = new Date(fecha);
    return isNaN(d.getTime())
      ? String(fecha)
      : new Intl.DateTimeFormat('es-CO', {
          dateStyle: 'short',
          timeStyle: 'medium',
        }).format(d);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="
          relative w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl
          bg-[#0d1630] border border-white/[0.12] shadow-2xl
          text-white font-[family-name:var(--font-archivo)]
        "
      >
        {/* Cabecera */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/[0.08] bg-[#111d3f]/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e3b341]/15 text-[#e3b341] border border-[#e3b341]/30">
              <BoxesIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-[family-name:var(--font-anton)] uppercase tracking-wide">
                  Historial de Movimientos Kardex
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e3b341]/10 text-[#e3b341] border border-[#e3b341]/30 font-mono">
                  {sucursalNombre}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Trazabilidad inmutable de entradas, salidas y ajustes de almacén (RF-ADM-B10).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDescargarCsv}
              title="Descargar reporte en formato CSV"
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.1] hover:bg-white/[0.08] text-xs font-semibold text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>📥 Exportar CSV</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filtros Superiores */}
        <div className="px-6 py-3 border-b border-white/[0.06] bg-[#09132b]/50 shrink-0 grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Selector de Producto */}
          <div className="sm:col-span-6">
            <select
              value={productoFiltro}
              onChange={(e) => {
                setProductoFiltro(e.target.value);
                handleFiltrar(undefined, e.target.value);
              }}
              className="w-full h-9 px-3 rounded-xl bg-[#09132b] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#e3b341]"
            >
              <option value="" className="bg-[#09132b] text-slate-400">
                📦 Todos los productos de la sede
              </option>
              {productos.map((prod) => (
                <option key={prod.id} value={prod.id} className="bg-[#09132b] text-white">
                  {prod.sku} — {prod.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Tipo de Movimiento */}
          <div className="sm:col-span-6 flex items-center gap-1.5">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'entrada', label: 'Entradas' },
              { id: 'salida', label: 'Salidas' },
              { id: 'ajuste_entrada', label: 'Ajuste +' },
              { id: 'ajuste_salida', label: 'Ajuste -' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTipoFiltro(t.id);
                  handleFiltrar(t.id, undefined);
                }}
                className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer text-center ${
                  tipoFiltro === t.id
                    ? 'bg-[#e3b341]/20 text-[#e3b341] border border-[#e3b341]/40'
                    : 'bg-white/[0.02] text-slate-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla de Movimientos con Scroll */}
        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {isLoading ? (
            <div className="p-12 text-center space-y-3">
              <div className="inline-block animate-spin text-[#e3b341]">
                <RefreshCwIcon size={24} />
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Consultando registros del Kardex...
              </p>
            </div>
          ) : movimientos.length === 0 ? (
            <div className="p-16 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-400">
                <BoxesIcon size={24} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Sin movimientos registrados
              </h3>
              <p className="text-xs text-slate-400">
                No existen registros de movimientos en el Kardex para los filtros aplicados.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#0d1630] border-b border-white/[0.08] z-10">
                <tr className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-[family-name:var(--font-ui)]">
                  <th className="py-2.5 px-4 w-36">Fecha / Hora</th>
                  <th className="py-2.5 px-4 w-28 text-center">Tipo</th>
                  <th className="py-2.5 px-4">Producto & SKU</th>
                  <th className="py-2.5 px-4 text-center w-24">Cantidad</th>
                  <th className="py-2.5 px-4 text-center w-24">Saldo</th>
                  <th className="py-2.5 px-4">Motivo / Causa</th>
                  <th className="py-2.5 px-4 w-32">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {movimientos.map((mov) => {
                  const esPositivo =
                    mov.tipo === 'entrada' || mov.tipo === 'ajuste_entrada';

                  return (
                    <tr
                      key={mov.id}
                      className="hover:bg-white/[0.02] transition-colors font-[family-name:var(--font-archivo)]"
                    >
                      {/* Fecha */}
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                        {formatearFecha(mov.fecha)}
                      </td>

                      {/* Tipo */}
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider font-mono border ${
                            mov.tipo === 'entrada'
                              ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
                              : mov.tipo === 'salida'
                              ? 'bg-red-500/15 text-red-400 border-red-500/30'
                              : mov.tipo === 'ajuste_entrada'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                          }`}
                        >
                          {mov.tipo === 'entrada'
                            ? 'Entrada'
                            : mov.tipo === 'salida'
                            ? 'Salida'
                            : mov.tipo === 'ajuste_entrada'
                            ? 'Ajuste +'
                            : 'Ajuste -'}
                        </span>
                      </td>

                      {/* Producto */}
                      <td className="py-2.5 px-4">
                        <p className="font-semibold text-white text-xs">
                          {mov.productoNombre || 'Producto sin nombre'}
                        </p>
                        {mov.productoSku && (
                          <span className="font-mono text-[10px] text-slate-400">
                            {mov.productoSku}
                          </span>
                        )}
                      </td>

                      {/* Cantidad */}
                      <td className="py-2.5 px-4 text-center font-mono font-bold">
                        <span
                          className={esPositivo ? 'text-[#10b981]' : 'text-red-400'}
                        >
                          {esPositivo ? `+${mov.cantidad}` : `-${mov.cantidad}`}
                        </span>
                      </td>

                      {/* Saldo Resultante */}
                      <td className="py-2.5 px-4 text-center font-mono text-slate-300">
                        {mov.stockResultante !== undefined
                          ? `${mov.stockResultante} unid.`
                          : '—'}
                      </td>

                      {/* Motivo */}
                      <td className="py-2.5 px-4 text-slate-300 text-[11px]">
                        {mov.motivo ? (
                          <span>{mov.motivo}</span>
                        ) : mov.proveedorNombre ? (
                          <span className="text-slate-400 italic">
                            Prov: {mov.proveedorNombre}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Sin detalle</span>
                        )}
                      </td>

                      {/* Responsable */}
                      <td className="py-2.5 px-4 text-[11px] text-slate-400">
                        {mov.usuarioNombre || 'Admin Sede'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.08] bg-[#111d3f]/40 shrink-0 text-xs text-slate-400 font-mono">
          <span>Total movimientos listados: {movimientos.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-white/20 text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            Cerrar Visor
          </button>
        </div>
      </div>
    </div>
  );
}
