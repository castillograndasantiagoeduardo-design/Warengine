'use client';

import React, { useState, useEffect } from 'react';
import { formatCOP } from '@/lib/format/moneda';
import { branchInventoryService } from '../../api/branch-inventory.service';
import type { ProductoInventarioSede, MovimientoKardexItem } from '../../types/branch-inventory.types';

interface ProductDrawerProps {
  open: boolean;
  producto: ProductoInventarioSede | null;
  sucursalId: number;
  onClose: () => void;
  onEditar: (producto: ProductoInventarioSede) => void;
  onVerKardex: (producto: ProductoInventarioSede) => void;
  onVerHistorialPrecios: (producto: ProductoInventarioSede) => void;
  onAjustarStockMinimo?: (producto: ProductoInventarioSede) => void;
  onStockActualizado?: () => void;
}

export function ProductDrawer({
  open,
  producto,
  sucursalId,
  onClose,
  onEditar,
  onVerKardex,
  onVerHistorialPrecios,
  onAjustarStockMinimo,
  onStockActualizado,
}: ProductDrawerProps) {
  const [recientes, setRecientes] = useState<MovimientoKardexItem[]>([]);
  const [loadingRecientes, setLoadingRecientes] = useState(false);
  const [editandoMinimo, setEditandoMinimo] = useState(false);
  const [nuevoMinimo, setNuevoMinimo] = useState<string>('');
  const [guardandoMinimo, setGuardandoMinimo] = useState(false);
  const [errorMinimo, setErrorMinimo] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !producto) {
      setRecientes([]);
      setEditandoMinimo(false);
      setErrorMinimo(null);
      return;
    }

    setNuevoMinimo(String(producto.stockMinimo ?? 0));
    setLoadingRecientes(true);
    branchInventoryService
      .consultarKardexSede(sucursalId, { productoId: producto.id, limit: 5 })
      .then((res: any) => {
        setRecientes(res.items ?? []);
      })
      .catch(() => {
        setRecientes([]);
      })
      .finally(() => {
        setLoadingRecientes(false);
      });
  }, [open, producto, sucursalId]);

  if (!open || !producto) return null;

  const stock = producto.stockActual ?? 0;
  const min = producto.stockMinimo ?? 0;
  const isAgotado = stock <= 0;
  const isBajo = stock > 0 && stock <= min;

  let nivelLabel = 'Óptimo';
  let nivelClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (isAgotado) {
    nivelLabel = 'Agotado';
    nivelClass = 'bg-red-500/10 text-red-400 border-red-500/20';
  } else if (isBajo) {
    nivelLabel = 'Stock bajo';
    nivelClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }

  const margen =
    producto.precioCompra && producto.precioCompra > 0
      ? (((producto.precioVenta - producto.precioCompra) / producto.precioVenta) * 100).toFixed(1)
      : null;

  const handleGuardarMinimo = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(nuevoMinimo);
    if (isNaN(val) || val < 0) {
      setErrorMinimo('El stock mínimo debe ser un número mayor o igual a 0.');
      return;
    }

    setGuardandoMinimo(true);
    setErrorMinimo(null);
    try {
      const res = await branchInventoryService.ajustarStockMinimo(producto.id, val);
      if (res.ok) {
        setEditandoMinimo(false);
        if (onStockActualizado) onStockActualizado();
      } else {
        setErrorMinimo(res.error || 'Error al actualizar stock mínimo.');
      }
    } catch (err: any) {
      setErrorMinimo(err?.message || 'Error inesperado.');
    } finally {
      setGuardandoMinimo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-lg bg-[#0d0914]/95 border-l border-white/10 shadow-2xl flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4 sticky top-0 bg-[#0d0914]/90 backdrop-blur-md z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-white/50 tracking-wider">
                {producto.sku}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${nivelClass}`}>
                {nivelLabel}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white leading-snug">
              {producto.nombre}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar panel"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 flex-1">
          {/* Stock en sede */}
          <div className="vidrio rounded-2xl p-4 space-y-3">
            <div className="text-xs uppercase tracking-wider text-white/40 font-semibold">
              Estado de inventario en sede
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-white/60">Stock actual</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-white mt-0.5">
                  {stock} <span className="text-xs font-normal text-white/40">unidades</span>
                </div>
              </div>

              <div>
                <div className="text-xs text-white/60">Stock mínimo</div>
                {!editandoMinimo ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-2xl font-bold font-mono tabular-nums text-white">
                      {min}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditandoMinimo(true)}
                      className="text-[11px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                    >
                      Editar
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleGuardarMinimo} className="mt-1 flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={nuevoMinimo}
                      onChange={(e) => setNuevoMinimo(e.target.value)}
                      className="w-16 h-8 px-2 rounded-lg bg-white/10 border border-white/20 text-white font-mono text-sm focus:outline-none focus:border-rose-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={guardandoMinimo}
                      className="px-2 h-8 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditandoMinimo(false)}
                      className="px-2 h-8 rounded-lg bg-white/10 text-white/60 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </form>
                )}
              </div>
            </div>

            {errorMinimo && (
              <p className="text-xs text-red-400 mt-1">{errorMinimo}</p>
            )}
          </div>

          {/* Datos comerciales */}
          <div className="vidrio rounded-2xl p-4 space-y-3">
            <div className="text-xs uppercase tracking-wider text-white/40 font-semibold">
              Datos comerciales
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-white/50 block">Precio de venta</span>
                <span className="text-sm font-bold text-amber-400 font-mono">
                  {formatCOP(producto.precioVenta)}
                </span>
              </div>
              <div>
                <span className="text-white/50 block">Precio de compra</span>
                <span className="text-sm font-mono text-white/80">
                  {producto.precioCompra ? formatCOP(producto.precioCompra) : 'No visible'}
                </span>
              </div>
              <div>
                <span className="text-white/50 block">Precio corporativo</span>
                <span className="text-sm font-mono text-white/80">
                  {producto.precioCorporativo ? formatCOP(producto.precioCorporativo) : '-'}
                </span>
              </div>
              {margen !== null && (
                <div>
                  <span className="text-white/50 block">Margen estimado</span>
                  <span className="text-sm font-semibold text-emerald-400 font-mono">
                    {margen}%
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-white/50 block">Categoría</span>
                <span className="text-white font-medium">
                  {producto.categoriaNombre || 'Sin categoría'}
                </span>
              </div>
              <div>
                <span className="text-white/50 block">Proveedor asignado</span>
                <span className="text-white font-medium">
                  {producto.proveedorNombre || (producto.proveedorId ? `Proveedor #${producto.proveedorId}` : 'Sin proveedor')}
                </span>
              </div>
            </div>
          </div>

          {/* Últimos movimientos Kardex */}
          <div className="vidrio rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-white/40 font-semibold">
                Últimos movimientos
              </span>
              <button
                type="button"
                onClick={() => onVerKardex(producto)}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
              >
                Ver todo el Kardex →
              </button>
            </div>

            {loadingRecientes ? (
              <div className="space-y-2 py-2">
                <div className="h-4 bg-white/5 rounded animate-pulse w-full" />
                <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
              </div>
            ) : recientes.length === 0 ? (
              <p className="text-xs text-white/40 italic py-2">
                Sin movimientos registrados para este producto en la sede.
              </p>
            ) : (
              <div className="space-y-2">
                {recientes.map((m) => {
                  const isPositive = m.cantidad > 0;
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0"
                    >
                      <div>
                        <div className="text-white/80 font-medium capitalize">
                          {m.tipo.replace('_', ' ')}
                        </div>
                        <div className="text-[10px] text-white/40">
                          {new Date(m.fecha).toLocaleDateString()} · {m.motivo || 'Sin motivo'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-mono font-bold ${
                            isPositive ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {isPositive ? `+${m.cantidad}` : m.cantidad}
                        </span>
                        <div className="text-[10px] font-mono text-white/40">
                          Saldo: {m.stockResultante}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#0d0914]/90 backdrop-blur-md flex flex-wrap gap-2 sticky bottom-0">
          <button
            type="button"
            onClick={() => onVerHistorialPrecios(producto)}
            className="flex-1 py-2 px-3 rounded-xl border border-white/15 hover:bg-white/5 text-white text-xs font-semibold transition-colors cursor-pointer text-center"
          >
            Historial precios
          </button>
          <button
            type="button"
            onClick={() => onEditar(producto)}
            className="flex-1 py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors cursor-pointer text-center shadow-lg shadow-rose-500/20"
          >
            Editar producto
          </button>
        </div>
      </div>
    </div>
  );
}
