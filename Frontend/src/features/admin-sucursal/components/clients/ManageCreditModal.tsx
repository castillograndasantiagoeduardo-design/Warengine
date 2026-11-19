'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { CreditCard, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { formatCOP } from '@/lib/format/moneda';
import type { ClienteDto } from '../../types/branch-clients.types';

interface ManageCreditModalProps {
  cliente: ClienteDto | null;
  isOpen: boolean;
  onClose: () => void;
  onCreditoActualizado: (cliente: ClienteDto) => void;
  onSubmit: (id: string, creditoHabilitado: boolean) => Promise<ClienteDto>;
}

export function ManageCreditModal({
  cliente,
  isOpen,
  onClose,
  onCreditoActualizado,
  onSubmit,
}: ManageCreditModalProps) {
  const [creditoHabilitado, setCreditoHabilitado] = useState(false);
  const [confirmarInactivacion, setConfirmarInactivacion] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (cliente) {
      setCreditoHabilitado(Boolean(cliente.creditoHabilitado));
      setConfirmarInactivacion(false);
      setErrorGeneral(null);
    }
  }, [cliente]);

  if (!cliente) return null;

  const tieneSaldo = (cliente.saldoPendiente ?? 0) > 0;
  const cambiandoAInactivo = !creditoHabilitado && cliente.creditoHabilitado;

  const handleClose = () => {
    if (!enviando) {
      setErrorGeneral(null);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGeneral(null);

    if (cambiandoAInactivo && tieneSaldo && !confirmarInactivacion) {
      setErrorGeneral(
        'Debes confirmar la suspensión del crédito para un cliente con saldo pendiente.',
      );
      return;
    }

    setEnviando(true);
    try {
      const res = await onSubmit(cliente.id, creditoHabilitado);
      onCreditoActualizado(res);
      onClose();
    } catch (err: any) {
      setErrorGeneral(
        err?.message || 'Error al actualizar el estado de crédito del cliente.',
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Gestión de Crédito Corporativo"
      description={`Configura la habilitación de crédito para ${cliente.nombreRazonSocial}`}
      size="md"
      locked={enviando}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorGeneral && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorGeneral}
          </div>
        )}

        {/* Resumen del cliente */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Cliente Corporativo:</span>
            <span className="text-xs font-semibold text-white">
              {cliente.nombreRazonSocial}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Documento Fiscal:</span>
            <span className="text-xs font-mono text-slate-200">
              {cliente.tipoDocumento} {cliente.numeroDocumento}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
            <span className="text-xs text-slate-400">Saldo a crédito acumulado:</span>
            <span className="text-base font-bold font-mono text-[#e3b341]">
              {formatCOP(cliente.saldoPendiente ?? 0)}
            </span>
          </div>
        </div>

        {/* Toggle de crédito */}
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={creditoHabilitado}
              onChange={(e) => setCreditoHabilitado(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
            />
            <div>
              <span className="text-sm font-semibold text-white block">
                Habilitar compras con Crédito Corporativo
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                Permite al vendedor-b2b o cajero emitir facturas con medio de pago &quot;Crédito
                Corporativo&quot; para esta empresa.
              </span>
            </div>
          </label>
        </div>

        {/* Advertencia si tiene saldo y se va a deshabilitar */}
        {cambiandoAInactivo && tieneSaldo && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Cliente con saldo pendiente ({formatCOP(cliente.saldoPendiente ?? 0)})</span>
            </div>
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              El cliente tiene facturas a crédito pendientes. Suspender el crédito impedirá nuevas
              compras a crédito, pero el historial y los saldos anteriores se conservarán.
            </p>
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmarInactivacion}
                onChange={(e) => setConfirmarInactivacion(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-amber-400/30 bg-amber-500/20 text-amber-500 focus:ring-0"
              />
              <span className="text-[11px] font-semibold text-amber-100">
                Confirmo suspender la línea de crédito
              </span>
            </label>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={handleClose}
            disabled={enviando}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando || (cambiandoAInactivo && tieneSaldo && !confirmarInactivacion)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-black bg-[#e3b341] hover:bg-[#d4a331] disabled:opacity-50 transition-colors shadow-lg shadow-[#e3b341]/20"
          >
            {enviando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{enviando ? 'Guardando...' : 'Confirmar cambios'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
