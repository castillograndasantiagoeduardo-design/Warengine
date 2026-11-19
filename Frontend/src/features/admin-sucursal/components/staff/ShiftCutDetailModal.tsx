'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { formatCOP } from '@/lib/format/moneda';
import { renderDiferenciaBadge } from './ShiftHistoryTable';
import type { TurnoCorteDetalle } from '../../types/branch-staff.types';

interface ShiftCutDetailModalProps {
  open: boolean;
  onClose: () => void;
  corte: TurnoCorteDetalle | null;
  cargando: boolean;
  error: string | null;
}

function formatFechaCompleta(fechaIso: string | null): string {
  if (!fechaIso) return '—';
  const d = new Date(fechaIso);
  if (isNaN(d.getTime())) return fechaIso;
  return d.toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function ShiftCutDetailModal({
  open,
  onClose,
  corte,
  cargando,
  error,
}: ShiftCutDetailModalProps) {
  const handleImprimir = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const footer = (
    <div className="flex items-center justify-between w-full">
      <button
        type="button"
        onClick={handleImprimir}
        disabled={!corte || cargando}
        className="px-4 py-2 rounded-xl text-xs font-medium text-brand-300 hover:text-white bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 transition-colors inline-flex items-center gap-1.5 disabled:opacity-40"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        <span>Imprimir comprobante</span>
      </button>

      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
      >
        Cerrar
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Corte y Arqueo de Turno"
      description={corte ? `Comprobante de cierre para ${corte.cajeroNombre || 'Cajero'}` : 'Detalle de liquidación'}
      footer={footer}
      size="md"
    >
      {cargando ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <svg className="w-6 h-6 animate-spin text-brand-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span className="text-xs text-white/50">Cargando desglose de ventas...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm">
          {error}
        </div>
      ) : !corte ? null : (
        <div className="space-y-5 text-xs">
          {/* Si fue cierre administrativo, mostrar banner de auditoría */}
          {corte.tipoCierre === 'administrativo' && (
            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-200 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-purple-100">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Cierre Administrativo Forzado</span>
              </div>
              <div className="text-[11px] leading-relaxed">
                Autorizado por:{' '}
                <strong className="text-white">
                  {corte.cerradoPorNombre || `Admin (${corte.cerradoPor?.slice(0, 8)})`}
                </strong>
              </div>
              {corte.motivoCierre && (
                <div className="text-[11px] text-purple-200/90 italic pt-1 border-t border-purple-500/20">
                  &ldquo;{corte.motivoCierre}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* Datos generales del turno */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 font-mono">
            <div>
              <span className="text-white/40 block text-[10px]">Apertura</span>
              <span className="text-white/90">{formatFechaCompleta(corte.fechaApertura)}</span>
            </div>
            <div>
              <span className="text-white/40 block text-[10px]">Cierre</span>
              <span className="text-white/90">{formatFechaCompleta(corte.fechaCierre)}</span>
            </div>
            <div>
              <span className="text-white/40 block text-[10px]">Sucursal / Caja</span>
              <span className="text-white/90">{corte.sucursalNombre} · {corte.cajaNombre || 'Caja 1'}</span>
            </div>
            <div>
              <span className="text-white/40 block text-[10px]">Comprobantes Emitidos</span>
              <span className="text-white/90 font-bold">{corte.cantidadVentas} facturas</span>
            </div>
          </div>

          {/* Desglose de ventas por método de pago */}
          <div className="space-y-2">
            <h4 className="font-semibold uppercase tracking-wider text-[11px] text-white/50">
              Ventas por Medio de Pago
            </h4>
            <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex justify-between items-center text-white/70">
                <span>Efectivo:</span>
                <span className="font-mono font-medium text-white tabular-nums">
                  {formatCOP(corte.ventasPorMetodo.efectivo)}
                </span>
              </div>
              <div className="flex justify-between items-center text-white/70">
                <span>Tarjetas (Débito / Crédito):</span>
                <span className="font-mono font-medium text-white tabular-nums">
                  {formatCOP(corte.ventasPorMetodo.tarjeta)}
                </span>
              </div>
              <div className="flex justify-between items-center text-white/70">
                <span>Transferencia electrónica:</span>
                <span className="font-mono font-medium text-white tabular-nums">
                  {formatCOP(corte.ventasPorMetodo.transferencia)}
                </span>
              </div>
              <div className="flex justify-between items-center text-white/70">
                <span>Crédito corporativo B2B:</span>
                <span className="font-mono font-medium text-white tabular-nums">
                  {formatCOP(corte.ventasPorMetodo.credito_corporativo)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/5 font-semibold text-white">
                <span>Total Facturado:</span>
                <span className="font-mono font-bold text-sm tabular-nums text-brand-300">
                  {formatCOP(corte.totalVentas)}
                </span>
              </div>
            </div>
          </div>

          {/* Arqueo de efectivo en caja */}
          <div className="space-y-2">
            <h4 className="font-semibold uppercase tracking-wider text-[11px] text-white/50">
              Liquidación y Arqueo de Efectivo
            </h4>
            <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex justify-between items-center text-white/60">
                <span>Fondo inicial en caja:</span>
                <span className="font-mono text-white/80 tabular-nums">{formatCOP(corte.fondoInicial)}</span>
              </div>
              <div className="flex justify-between items-center text-white/60">
                <span>+ Ventas en efectivo cobradas:</span>
                <span className="font-mono text-white/80 tabular-nums">
                  {formatCOP(corte.ventasPorMetodo.efectivo)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-white/5 font-medium text-white/90">
                <span>= Efectivo esperado en caja:</span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">
                  {formatCOP(corte.efectivoEsperado)}
                </span>
              </div>
              <div className="flex justify-between items-center text-white/90 font-medium">
                <span>Efectivo contado (declarado):</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {corte.fondoFinal !== null ? formatCOP(corte.fondoFinal) : 'Sin arqueo físico'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="font-semibold text-white">Resultado del arqueo:</span>
                <div>{renderDiferenciaBadge(corte.diferencia)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
