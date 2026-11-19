'use client';

import React, { useState, useEffect } from 'react';
import { Pagination } from '../shared/Pagination';
import { LoadingState, EmptyState } from '../shared/States';
import { branchInventoryService } from '../../api/branch-inventory.service';
import type {
  MovimientoKardexItem,
  FiltrosKardexDTO,
} from '../../types/branch-inventory.types';

interface KardexViewProps {
  sucursalId: number;
  productoIdInicial?: string;
}

export function KardexView({ sucursalId, productoIdInicial = '' }: KardexViewProps) {
  const [items, setItems] = useState<MovimientoKardexItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filtros
  const [rangoRapido, setRangoRapido] = useState<'todos' | 'hoy' | '7dias' | '30dias' | 'custom'>('todos');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [tipo, setTipo] = useState<string>('todos');
  const [productoId, setProductoId] = useState<string>(productoIdInicial);

  const calcularFechas = (rango: 'todos' | 'hoy' | '7dias' | '30dias' | 'custom') => {
    const hoy = new Date();
    const formato = (d: Date) => d.toISOString().slice(0, 10);

    if (rango === 'hoy') {
      return { desde: formato(hoy), hasta: formato(hoy) };
    }
    if (rango === '7dias') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { desde: formato(d), hasta: formato(hoy) };
    }
    if (rango === '30dias') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return { desde: formato(d), hasta: formato(hoy) };
    }
    return { desde: '', hasta: '' };
  };

  const handleRangoRapido = (rango: 'todos' | 'hoy' | '7dias' | '30dias' | 'custom') => {
    setRangoRapido(rango);
    if (rango !== 'custom') {
      const { desde, hasta } = calcularFechas(rango);
      setFechaDesde(desde);
      setFechaHasta(hasta);
    }
    setPage(1);
  };

  const cargarKardex = async () => {
    setIsLoading(true);
    try {
      const filtros: FiltrosKardexDTO = {
        sucursalId,
        limit,
        offset: (page - 1) * limit,
      };

      if (productoId.trim()) filtros.productoId = productoId.trim();
      if (tipo !== 'todos') filtros.tipo = tipo as any;
      if (fechaDesde) filtros.desde = fechaDesde;
      if (fechaHasta) filtros.hasta = fechaHasta;

      const res = await branchInventoryService.consultarKardex(filtros);
      setItems(res.items);
      setTotal(res.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarKardex();
  }, [sucursalId, page, tipo, fechaDesde, fechaHasta, productoId]);

  const handleExportarCsv = async () => {
    setIsExporting(true);
    try {
      const blob = await branchInventoryService.descargarKardexCsv({
        sucursalId,
        productoId: productoId.trim() || undefined,
        tipo: tipo !== 'todos' ? tipo : undefined,
        desde: fechaDesde || undefined,
        hasta: fechaHasta || undefined,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kardex_sede_${sucursalId}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.message || 'Error al descargar Kardex.');
    } finally {
      setIsExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <div className="vidrio rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Rangos rápidos de fecha */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'todos', label: 'Todo el historial' },
              { id: 'hoy', label: 'Hoy' },
              { id: '7dias', label: 'Últimos 7 días' },
              { id: '30dias', label: 'Últimos 30 días' },
              { id: 'custom', label: 'Personalizado' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRangoRapido(r.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  rangoRapido === r.id
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Botón Exportar */}
          <button
            type="button"
            onClick={handleExportarCsv}
            disabled={isExporting}
            className="px-3.5 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
          >
            <span>📥</span>
            <span>{isExporting ? 'Exportando...' : 'Exportar Kardex (CSV)'}</span>
          </button>
        </div>

        {/* Filtros secundarios: tipo, fechas personalizadas, producto */}
        <div className="flex flex-wrap gap-2.5 items-center pt-2 border-t border-white/5">
          {rangoRapido === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => {
                  setFechaDesde(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
              />
              <span className="text-white/40 text-xs">hasta</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => {
                  setFechaHasta(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
          )}

          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value);
              setPage(1);
            }}
            aria-label="Filtrar por tipo de movimiento"
            className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="todos">Todos los tipos de movimiento</option>
            <option value="entrada">Entradas de mercancía</option>
            <option value="salida">Salidas manuales</option>
            <option value="ajuste_positivo">Ajustes positivos (+)</option>
            <option value="ajuste_negativo">Ajustes negativos (-)</option>
            <option value="venta">Ventas POS / Facturas</option>
            <option value="devolucion">Devoluciones</option>
          </select>

          <input
            type="text"
            placeholder="Filtrar por ID de producto o SKU..."
            value={productoId}
            onChange={(e) => {
              setProductoId(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 text-xs focus:outline-none focus:border-rose-500 w-full sm:w-64"
          />

          {(productoId || tipo !== 'todos' || fechaDesde || fechaHasta) && (
            <button
              type="button"
              onClick={() => {
                setProductoId('');
                setTipo('todos');
                setFechaDesde('');
                setFechaHasta('');
                setRangoRapido('todos');
                setPage(1);
              }}
              className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Movimientos */}
      <div className="vidrio rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <LoadingState rows={8} />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No hay movimientos registrados"
              description="No se encontraron movimientos en el Kardex para los filtros y fechas seleccionadas."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-white/50 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4 text-right">Cantidad</th>
                  <th className="py-3 px-4 text-right">Saldo</th>
                  <th className="py-3 px-4">Motivo / Documento</th>
                  <th className="py-3 px-4">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {items.map((m) => {
                  const isPositive = m.cantidad > 0;
                  let badgeColor = 'bg-white/5 text-white/70 border-white/10';
                  if (m.tipo.includes('entrada') || m.tipo.includes('positivo')) {
                    badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                  } else if (m.tipo.includes('salida') || m.tipo.includes('negativo') || m.tipo.includes('venta')) {
                    badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
                  } else if (m.tipo.includes('devolucion')) {
                    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                  }

                  return (
                    <tr key={m.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 text-white/60 whitespace-nowrap">
                        {new Date(m.fecha).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">
                          {m.productoNombre || `Producto #${m.productoId}`}
                        </div>
                        {m.productoSku && (
                          <div className="text-[11px] font-mono text-white/40">
                            {m.productoSku}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${badgeColor}`}>
                          {m.tipo.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
                          {isPositive ? `+${m.cantidad}` : m.cantidad}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-white/80 tabular-nums">
                        {m.stockResultante !== undefined ? m.stockResultante : '-'}
                      </td>
                      <td className="py-3 px-4 text-white/70 max-w-xs truncate">
                        {m.motivo || (m.facturaId ? `Factura #${m.facturaId}` : '-')}
                      </td>
                      <td className="py-3 px-4 text-white/60">
                        {m.usuarioNombre || (m.usuarioId ? `Usuario #${m.usuarioId}` : '-')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {total > limit && (
          <div className="p-4 border-t border-white/[0.08]">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
