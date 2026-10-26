'use client';

/**
 * StockCountAuditModal.tsx — Modal para ajuste de inventario por conteo físico directo (RF-ADM-B17).
 * 
 * Principio SOLID: Single Responsibility Principle (SRP).
 * Cálculo automático de discrepancias (sobrantes/faltantes) y registro de auditoría.
 */

import React, { useState, useEffect } from 'react';
import { Button3D } from '@/components/ui/Button3D';
import { PackageIcon, RefreshCwIcon } from './Icons';
import type {
  ProductoInventarioSede,
  AjustarInventarioDTO,
} from '../types/branch-inventory.types';

interface StockCountAuditModalProps {
  isOpen: boolean;
  sucursalId: number;
  productos: ProductoInventarioSede[];
  productoInicial?: ProductoInventarioSede | null;
  onClose: () => void;
  onAjustar: (dto: AjustarInventarioDTO) => Promise<{ ok: boolean; error?: string; data?: any }>;
}

export function StockCountAuditModal({
  isOpen,
  sucursalId,
  productos,
  productoInicial,
  onClose,
  onAjustar,
}: StockCountAuditModalProps) {
  const [productoId, setProductoId] = useState('');
  const [stockFisico, setStockFisico] = useState<number | ''>('');
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (productoInicial) {
        setProductoId(productoInicial.id);
        setStockFisico(productoInicial.stockActual);
      } else if (productos.length > 0) {
        setProductoId(productos[0].id);
        setStockFisico(productos[0].stockActual);
      }
      setMotivo('');
      setErrorMsg(null);
    }
  }, [isOpen, productoInicial, productos]);

  if (!isOpen) return null;

  const productoSeleccionado = productos.find((p) => p.id === productoId);
  const stockSistema = productoSeleccionado?.stockActual ?? 0;
  const fisicoNum = typeof stockFisico === 'number' ? stockFisico : stockSistema;
  const diferencia = fisicoNum - stockSistema;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!productoId) {
      setErrorMsg('Debes seleccionar un producto.');
      return;
    }

    if (stockFisico === '' || stockFisico < 0) {
      setErrorMsg('El stock físico verificado no puede ser negativo.');
      return;
    }

    if (motivo.trim().length < 5) {
      setErrorMsg('Debes ingresar una justificación detallada de al menos 5 caracteres para la auditoría.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onAjustar({
        productoId,
        sucursalId,
        stockFisico: Number(stockFisico),
        motivo: motivo.trim(),
      });

      if (res.ok) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al aplicar el ajuste.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="
          relative w-full max-w-lg overflow-hidden rounded-2xl
          bg-[#0d1630] border border-white/[0.12] shadow-2xl
          text-white font-[family-name:var(--font-archivo)]
        "
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#111d3f]/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e3b341]/15 text-[#e3b341] border border-[#e3b341]/30">
              <RefreshCwIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold font-[family-name:var(--font-anton)] uppercase tracking-wide">
                Ajuste por Conteo Físico
              </h2>
              <p className="text-xs text-slate-400">
                Auditoría y conciliación de existencias en sede (RF-ADM-B17).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Selector de Producto */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Producto a Auditar *
            </label>
            <select
              value={productoId}
              onChange={(e) => {
                setProductoId(e.target.value);
                const found = productos.find((p) => p.id === e.target.value);
                if (found) setStockFisico(found.stockActual);
              }}
              className="w-full h-10 px-3 rounded-xl bg-[#09132b] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#e3b341]"
            >
              {productos.map((prod) => (
                <option key={prod.id} value={prod.id} className="bg-[#09132b] text-white">
                  {prod.sku} — {prod.nombre} (Sistema: {prod.stockActual} unid.)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Stock Registrado en Sistema */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Stock Registrado en Sistema
              </label>
              <div className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center text-xs font-mono text-slate-300">
                {stockSistema} unidades
              </div>
            </div>

            {/* Stock Físico Contado */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Stock Físico Real en Bodega *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Unidades contadas"
                value={stockFisico}
                onChange={(e) => setStockFisico(e.target.value !== '' ? Number(e.target.value) : '')}
                required
                className="w-full h-10 px-3 rounded-xl bg-[#09132b] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#e3b341] font-mono font-bold"
              />
            </div>
          </div>

          {/* Cuadro de Discrepancia Calculada */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Variación calculada en conteo:</span>
              <div className="flex items-center gap-2">
                {diferencia > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-bold font-mono text-xs">
                    +{diferencia} Unidades (Sobrante de stock)
                  </span>
                )}
                {diferencia < 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 font-bold font-mono text-xs">
                    {diferencia} Unidades (Faltante en inventario)
                  </span>
                )}
                {diferencia === 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 font-semibold font-mono text-xs">
                    0 Unidades (Cuadre idéntico al sistema)
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed font-[family-name:var(--font-archivo)]">
              {diferencia > 0
                ? 'Se creará automáticamente un asiento de ajuste positivo en el Kardex para igualar la existencia real.'
                : diferencia < 0
                ? 'Se aplicará una deducción en Kardex respaldada por este informe de discrepancia física.'
                : 'El conteo físico coincide con el sistema. Se registrará la ratificación del conteo en auditoría.'}
            </p>
          </div>

          {/* Justificación del Ajuste */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Causa o Justificación del Cuadre * (Mínimo 5 caracteres)
            </label>
            <textarea
              rows={2}
              placeholder="Ej. Conteo físico trimestral de bodega / Hallazgo de unidades no registradas en estante B-4"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
              className="w-full p-3 rounded-xl bg-[#09132b] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#e3b341] resize-none"
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs rounded-xl border border-white/20 text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <Button3D
              type="submit"
              size="sm"
              disabled={isSubmitting || stockFisico === '' || motivo.trim().length < 5}
              className="font-bold uppercase text-xs"
            >
              {isSubmitting ? 'Aplicando Ajuste...' : 'Confirmar Ajuste'}
            </Button3D>
          </div>
        </form>
      </div>
    </div>
  );
}
