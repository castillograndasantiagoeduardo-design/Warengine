'use client';

import React, { useState, useEffect } from 'react';
import { Pagination } from '../shared/Pagination';
import { LoadingState, EmptyState } from '../shared/States';
import { branchInventoryService } from '../../api/branch-inventory.service';
import type {
  EntradaMercanciaItem,
  ProveedorInventario,
} from '../../types/branch-inventory.types';

interface StockEntriesViewProps {
  sucursalId: number;
  proveedores: ProveedorInventario[];
  onRegistrarEntrada: () => void;
  onVerDetalle: (entrada: EntradaMercanciaItem) => void;
  onAnularEntrada: (entrada: EntradaMercanciaItem) => void;
}

export function StockEntriesView({
  sucursalId,
  proveedores,
  onRegistrarEntrada,
  onVerDetalle,
  onAnularEntrada,
}: StockEntriesViewProps) {
  const [items, setItems] = useState<EntradaMercanciaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [proveedorId, setProveedorId] = useState<string>('todos');

  const cargarEntradas = async () => {
    setIsLoading(true);
    try {
      const res = await branchInventoryService.listarEntradas({
        sucursalId,
        proveedorId: proveedorId !== 'todos' ? Number(proveedorId) : undefined,
        limit,
        offset: (page - 1) * limit,
      });
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
    cargarEntradas();
  }, [sucursalId, page, proveedorId]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      {/* Barra de Controles y Filtros */}
      <div className="vidrio rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <select
            value={proveedorId}
            onChange={(e) => {
              setProveedorId(e.target.value);
              setPage(1);
            }}
            aria-label="Filtrar por proveedor"
            className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="todos">Todos los proveedores</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          {proveedorId !== 'todos' && (
            <button
              type="button"
              onClick={() => {
                setProveedorId('todos');
                setPage(1);
              }}
              className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
            >
              Quitar filtro
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onRegistrarEntrada}
          className="h-10 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
        >
          <span>+</span>
          <span>Registrar entrada de mercancía</span>
        </button>
      </div>

      {/* Tabla de Entradas */}
      <div className="vidrio rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <LoadingState rows={6} />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No hay entradas registradas"
              description="No se han registrado recepciones de mercancía con los criterios seleccionados."
              action={
                <button
                  type="button"
                  onClick={onRegistrarEntrada}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Registrar primera entrada
                </button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-white/50 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4 text-right">Cantidad</th>
                  <th className="py-3 px-4">Documento / Motivo</th>
                  <th className="py-3 px-4">Registrado por</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {items.map((e) => (
                  <tr key={e.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 text-white/60 whitespace-nowrap">
                      {new Date(e.fecha).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">
                        {e.productoNombre}
                      </div>
                      <div className="text-[11px] font-mono text-white/40">
                        SKU: {e.productoSku}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white/70">
                      {e.proveedorNombre || (e.proveedorId ? `Proveedor #${e.proveedorId}` : '-')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      +{e.cantidad}
                    </td>
                    <td className="py-3 px-4 text-white/60 max-w-xs truncate">
                      {e.motivo || 'Reposición regular'}
                    </td>
                    <td className="py-3 px-4 text-white/60">
                      {e.usuarioNombre || `Usuario #${e.usuarioId}`}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onVerDetalle(e)}
                          className="px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/5 text-white/80 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Detalle
                        </button>
                        <button
                          type="button"
                          onClick={() => onAnularEntrada(e)}
                          className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Anular
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
