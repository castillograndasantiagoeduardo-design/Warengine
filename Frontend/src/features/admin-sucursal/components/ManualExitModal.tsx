'use client';

/**
 * ManualExitModal.tsx — Modal para registrar salidas manuales justificadas de inventario (RF-ADM-B8).
 * 
 * Principios SOLID:
 * - Single Responsibility Principle (SRP): Gestión exclusiva de la baja justificada de stock.
 * - Validación de integridad: Bloqueo estricto contra existencias negativas (RF-ADM-B9).
 */

import React, { useState, useEffect } from 'react';
import { Button3D } from '@/components/ui/Button3D';
import { PackageIcon, TriangleAlertIcon } from './Icons';
import type {
  ProductoInventarioSede,
  RegistrarSalidaDTO,
} from '../types/branch-inventory.types';

interface ManualExitModalProps {
  isOpen: boolean;
  sucursalId: number;
  productos: ProductoInventarioSede[];
  productoInicial?: ProductoInventarioSede | null;
  onClose: () => void;
  onRegistrar: (dto: RegistrarSalidaDTO) => Promise<{ ok: boolean; error?: string }>;
}

const MOTIVOS_TIPIFICADOS = [
  'Merma operativa por manipulación o transporte',
  'Avería / Producto con defecto de fábrica',
  'Rotura accidental en estantería o exhibición',
  'Fecha de caducidad / Vencimiento alcanzado',
  'Muestra técnica comercial o demostración',
  'Deterioro por condiciones ambientales',
  'Otro motivo justificado de baja',
];

export function ManualExitModal({
  isOpen,
  sucursalId,
  productos,
  productoInicial,
  onClose,
  onRegistrar,
}: ManualExitModalProps) {
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [motivoTipificado, setMotivoTipificado] = useState(MOTIVOS_TIPIFICADOS[0]);
  const [observacionDetallada, setObservacionDetallada] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (productoInicial) {
        setProductoId(productoInicial.id);
      } else if (productos.length > 0) {
        setProductoId(productos[0].id);
      }
      setCantidad('');
      setMotivoTipificado(MOTIVOS_TIPIFICADOS[0]);
      setObservacionDetallada('');
      setErrorMsg(null);
    }
  }, [isOpen, productoInicial, productos]);

  if (!isOpen) return null;

  const productoSeleccionado = productos.find((p) => p.id === productoId);
  const stockActual = productoSeleccionado?.stockActual ?? 0;
  const cantNum = typeof cantidad === 'number' ? cantidad : 0;
  const stockProyectado = stockActual - cantNum;
  const esSobrepaso = cantNum > stockActual;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!productoId) {
      setErrorMsg('Debes seleccionar un producto.');
      return;
    }

    if (!cantidad || cantidad <= 0) {
      setErrorMsg('La cantidad a retirar debe ser mayor a 0 unidades.');
      return;
    }

    if (esSobrepaso) {
      setErrorMsg(`No es posible retirar ${cantNum} unidades. El stock actual en sede es de solo ${stockActual} unidades.`);
      return;
    }

    const motivoFinal = observacionDetallada.trim()
      ? `${motivoTipificado}: ${observacionDetallada.trim()}`
      : motivoTipificado;

    if (motivoFinal.length < 3) {
      setErrorMsg('El motivo de la salida debe ser claro y específico.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onRegistrar({
        productoId,
        sucursalId,
        cantidad: Number(cantidad),
        motivo: motivoFinal,
      });

      if (res.ok) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al procesar la salida.');
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-400 border border-red-500/30">
              <TriangleAlertIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold font-[family-name:var(--font-anton)] uppercase tracking-wide">
                Registrar Salida Manual
              </h2>
              <p className="text-xs text-slate-400">
                Baja justificada de inventario con motivo obligatorio (RF-ADM-B8).
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
              Producto a Retirar *
            </label>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#09132b] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#e3b341]"
            >
              {productos.map((prod) => (
                <option key={prod.id} value={prod.id} className="bg-[#09132b] text-white">
                  {prod.sku} — {prod.nombre} (Stock disponible: {prod.stockActual} unid.)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cantidad a Retirar */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Cantidad a Dar de Baja *
              </label>
              <input
                type="number"
                min="1"
                max={stockActual > 0 ? stockActual : 1}
                step="1"
                placeholder="Ej. 2"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value ? Number(e.target.value) : '')}
                required
                className={`w-full h-10 px-3 rounded-xl bg-[#09132b] border text-xs text-white focus:outline-none font-mono ${
                  esSobrepaso ? 'border-red-500 focus:border-red-400' : 'border-white/[0.1] focus:border-[#e3b341]'
                }`}
              />
              {esSobrepaso && (
                <span className="text-[11px] text-red-400 mt-1 block">
                  Excede el stock disponible ({stockActual})
                </span>
              )}
            </div>

            {/* Motivo Tipificado */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Causa Operativa *
              </label>
              <select
                value={motivoTipificado}
                onChange={(e) => setMotivoTipificado(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#09132b] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#e3b341]"
              >
                {MOTIVOS_TIPIFICADOS.map((mot) => (
                  <option key={mot} value={mot} className="bg-[#09132b] text-white">
                    {mot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tarjeta de Cálculo de Saldo Resultante */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-slate-400">Stock resultante en sede:</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-300">{stockActual} actuales</span>
              <span className="text-red-400 font-bold">-{cantNum}</span>
              <span className="text-slate-500">=</span>
              <span
                className={`font-bold text-sm px-2 py-0.5 rounded-lg border ${
                  esSobrepaso
                    ? 'bg-red-500/20 text-red-400 border-red-500/40'
                    : 'bg-[#e3b341]/10 text-[#e3b341] border-[#e3b341]/25'
                }`}
              >
                {esSobrepaso ? 'Negativo no permitido' : `${stockProyectado} unidades`}
              </span>
            </div>
          </div>

          {/* Justificación Detallada */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Detalle de Justificación (Auditoría interna)
            </label>
            <textarea
              rows={2}
              placeholder="Indica lote, estado físico o circunstancias que justifican la baja de inventario..."
              value={observacionDetallada}
              onChange={(e) => setObservacionDetallada(e.target.value)}
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
            <button
              type="submit"
              disabled={isSubmitting || esSobrepaso || cantNum <= 0}
              className="
                px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider
                bg-red-500 hover:bg-red-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                text-white transition-all shadow-lg shadow-red-500/20 cursor-pointer
              "
            >
              {isSubmitting ? 'Procesando Baja...' : 'Registrar Salida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
