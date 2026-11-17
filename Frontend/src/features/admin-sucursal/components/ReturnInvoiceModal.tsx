'use client';

/**
 * ReturnInvoiceModal.tsx — Modal para registro de devoluciones totales o parciales (RF-FMC-E8 / RF-FMC-E10).
 *
 * Construido estrictamente sobre el contrato POST /ventas/facturas/:id/devoluciones:
 * { motivo, reingresaStock, devolverTodo, items: [{ facturaItemId, cantidad }] }
 * Reutiliza el diálogo accesible `<Modal>` de `@/components/ui/Modal`.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { formatCOP } from '@/lib/format/moneda';
import type {
  FacturaSede,
  RegistrarDevolucionPayload,
} from '../types/branch-invoicing.types';

interface ReturnInvoiceModalProps {
  open: boolean;
  factura: FacturaSede | null;
  onClose: () => void;
  onRegistrarDevolucion: (
    id: string,
    payload: RegistrarDevolucionPayload,
  ) => Promise<{ ok: boolean; error?: string }>;
  onSuccess?: () => void;
}

export function ReturnInvoiceModal({
  open,
  factura,
  onClose,
  onRegistrarDevolucion,
  onSuccess,
}: ReturnInvoiceModalProps) {
  const [motivo, setMotivo] = useState('');
  const [reingresaStock, setReingresaStock] = useState(true);
  const [devolverTodo, setDevolverTodo] = useState(false);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mapear lo ya devuelto por línea de factura
  const yaDevueltoMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!factura) return map;
    for (const dev of factura.devoluciones || []) {
      const prev = map.get(dev.facturaItemId) ?? 0;
      map.set(dev.facturaItemId, prev + dev.cantidad);
    }
    return map;
  }, [factura]);

  // Inicializar o resetear estado al abrir
  useEffect(() => {
    if (open) {
      setMotivo('');
      setReingresaStock(true);
      setDevolverTodo(false);
      setCantidades({});
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [open]);

  // Lista de items con su remanente
  const itemsConRemanente = useMemo(() => {
    if (!factura) return [];
    return factura.items.map((it) => {
      const yaDevuelto = yaDevueltoMap.get(it.id) ?? 0;
      const disponible = Math.max(0, it.cantidad - yaDevuelto);
      return {
        ...it,
        yaDevuelto,
        disponible,
      };
    });
  }, [factura, yaDevueltoMap]);

  // Cálculo de vista previa de reembolso estimado
  const totalReembolsoEstimado = useMemo(() => {
    if (!factura) return 0;
    let suma = 0;
    for (const it of itemsConRemanente) {
      const cant = devolverTodo ? it.disponible : (cantidades[it.id] || 0);
      if (cant > 0) {
        const descUnitario = it.cantidad > 0 ? it.descuento / it.cantidad : 0;
        suma += (it.precioUnitario - descUnitario) * cant;
      }
    }
    return Math.round(suma * 100) / 100;
  }, [factura, itemsConRemanente, devolverTodo, cantidades]);

  if (!open || !factura) return null;

  const handleCantidadChange = (itemId: string, valor: number, max: number) => {
    const limpia = Math.max(0, Math.min(Math.floor(valor || 0), max));
    setCantidades((prev) => ({
      ...prev,
      [itemId]: limpia,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const motivoTrimmed = motivo.trim();
    if (motivoTrimmed.length < 5) {
      setErrorMsg('El motivo de la devolución es obligatorio (mínimo 5 caracteres).');
      return;
    }

    const itemsPayload = Object.entries(cantidades)
      .filter(([_, cant]) => cant > 0)
      .map(([facturaItemId, cantidad]) => ({ facturaItemId, cantidad }));

    if (!devolverTodo && itemsPayload.length === 0) {
      setErrorMsg('Selecciona al menos una unidad a devolver o marca devolución total.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: RegistrarDevolucionPayload = {
        motivo: motivoTrimmed,
        reingresaStock,
        devolverTodo,
        items: devolverTodo ? [] : itemsPayload,
      };

      const res = await onRegistrarDevolucion(factura.id, payload);
      if (!res.ok) {
        setErrorMsg(res.error || 'No fue posible registrar la devolución.');
        return;
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al registrar la devolución.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hayItemsDevolvibles = itemsConRemanente.some((it) => it.disponible > 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Registrar Devolución — ${factura.folioFormateado}`}
      description="Registra la devolución total o parcial de productos con cálculo de reembolso y reingreso a kardex."
      size="lg"
      locked={isSubmitting}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="text-xs">
            <span className="text-slate-400">Reembolso estimado: </span>
            <span className="font-mono font-bold text-[#e3b341] text-sm">
              {formatCOP(totalReembolsoEstimado)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-white/20 text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors text-xs font-semibold cursor-pointer disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                motivo.trim().length < 5 ||
                (!devolverTodo && totalReembolsoEstimado <= 0) ||
                !hayItemsDevolvibles
              }
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-40"
            >
              {isSubmitting ? 'Registrando...' : 'Confirmar Devolución'}
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs">
            {errorMsg}
          </div>
        )}

        {!hayItemsDevolvibles ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs text-center">
            Esta factura ya no tiene unidades disponibles para devolver.
          </div>
        ) : (
          <>
            {/* Opciones Generales */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={devolverTodo}
                  onChange={(e) => setDevolverTodo(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-[#e3b341] focus:ring-0 cursor-pointer h-4 w-4"
                />
                <span className="font-semibold text-white">Devolución total de la factura</span>
                <span className="text-[11px] text-slate-400">(Devuelve todo el remanente disponible)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={reingresaStock}
                  onChange={(e) => setReingresaStock(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-[#e3b341] focus:ring-0 cursor-pointer h-4 w-4"
                />
                <span className="text-slate-300">Reingresar stock al inventario</span>
              </label>
            </div>

            {/* Tabla de Selección de Ítems */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                Selección de Unidades por Producto
              </span>

              <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-white/[0.01]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02] text-slate-400 text-[10px] uppercase font-mono">
                      <th scope="col" className="py-2.5 px-3">Producto</th>
                      <th scope="col" className="py-2.5 px-3 text-center">Facturado</th>
                      <th scope="col" className="py-2.5 px-3 text-center">Ya Devuelto</th>
                      <th scope="col" className="py-2.5 px-3 text-center">Disponible</th>
                      <th scope="col" className="py-2.5 px-3 text-right">Cant. a Devolver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {itemsConRemanente.map((it) => {
                      const cantActual = devolverTodo ? it.disponible : (cantidades[it.id] || 0);
                      return (
                        <tr key={it.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-white block">{it.productoNombre}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Unitario: {formatCOP(it.precioUnitario)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                            {it.cantidad}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-amber-300">
                            {it.yaDevuelto}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-400">
                            {it.disponible}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {devolverTodo ? (
                              <span className="font-mono font-bold text-[#e3b341]">
                                {it.disponible}
                              </span>
                            ) : (
                              <input
                                type="number"
                                min={0}
                                max={it.disponible}
                                disabled={it.disponible === 0}
                                value={cantActual || ''}
                                placeholder="0"
                                onChange={(e) =>
                                  handleCantidadChange(
                                    it.id,
                                    parseInt(e.target.value, 10) || 0,
                                    it.disponible,
                                  )
                                }
                                aria-label={`Cantidad a devolver para ${it.productoNombre}`}
                                className="w-20 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.1] text-right font-mono text-xs text-white focus:outline-none focus:border-[#e3b341]/60 disabled:opacity-30"
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Motivo Obligatorio */}
            <div>
              <label htmlFor="return-reason" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Motivo de la devolución <span className="text-amber-400">*</span>
              </label>
              <textarea
                id="return-reason"
                rows={2}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Producto defectuoso / Error de digitación en caja / Cambio solicitado por cliente..."
                maxLength={255}
                className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/60 resize-none"
                required
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>Mínimo 5 caracteres</span>
                <span>{motivo.length} / 255</span>
              </div>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
