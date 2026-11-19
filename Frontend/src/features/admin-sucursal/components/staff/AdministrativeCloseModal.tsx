'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { formatCOP } from '@/lib/format/moneda';
import type { CierreAdministrativoInput, TurnoCajaActivo } from '../../types/branch-staff.types';

interface AdministrativeCloseModalProps {
  open: boolean;
  onClose: () => void;
  turno: TurnoCajaActivo | null;
  onConfirm: (data: CierreAdministrativoInput) => Promise<void>;
  guardando: boolean;
  error: string | null;
}

export function AdministrativeCloseModal({
  open,
  onClose,
  turno,
  onConfirm,
  guardando,
  error,
}: AdministrativeCloseModalProps) {
  const [motivo, setMotivo] = useState('');
  const [efectivoContado, setEfectivoContado] = useState('');
  const [confirmado, setConfirmado] = useState(false);

  // Reiniciar estado al abrir con un nuevo turno
  useEffect(() => {
    if (open) {
      setMotivo('');
      setEfectivoContado('');
      setConfirmado(false);
    }
  }, [open, turno]);

  if (!turno) return null;

  const esperadoEnCaja = turno.efectivoEsperado ?? (turno.fondoInicial + turno.totalVentas);

  const efectivoContadoNum =
    efectivoContado.trim() !== '' && !isNaN(Number(efectivoContado))
      ? Number(efectivoContado)
      : null;

  const diferencia =
    efectivoContadoNum !== null ? efectivoContadoNum - esperadoEnCaja : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (motivo.trim().length < 5 || !confirmado || guardando) return;

    await onConfirm({
      motivo: motivo.trim(),
      fondoFinal: efectivoContadoNum !== null ? efectivoContadoNum : undefined,
    });
  };

  const footer = (
    <div className="flex items-center justify-between w-full">
      <button
        type="button"
        onClick={onClose}
        disabled={guardando}
        className="px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
      >
        Cancelar
      </button>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={motivo.trim().length < 5 || !confirmado || guardando}
        className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:bg-rose-950 disabled:text-white/40 disabled:border-transparent border border-rose-500/30 transition-all flex items-center gap-2 shadow-lg shadow-rose-950/40"
      >
        {guardando ? (
          <>
            <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>Procesando cierre...</span>
          </>
        ) : (
          <span>Confirmar cierre administrativo</span>
        )}
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cierre Administrativo de Turno"
      description={`Cierre forzado y arqueo administrativo para ${turno.cajeroNombre || turno.usuarioNombre || 'el cajero en turno'}.`}
      footer={footer}
      size="md"
      locked={guardando}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Banner de advertencia */}
        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs leading-relaxed flex items-start gap-2.5">
          <svg className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <strong className="font-semibold block text-rose-100">Acción de supervisión administrativa</strong>
            El turno se cerrará de inmediato y el cajero no podrá seguir facturando en él. El evento quedará auditado con tu identidad y el motivo obligatorio.
          </div>
        </div>

        {/* Resumen financiero del turno */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2 text-xs">
          <div className="flex justify-between items-center text-white/60">
            <span>Cajero en turno:</span>
            <strong className="text-white font-medium">{turno.cajeroNombre || turno.usuarioNombre}</strong>
          </div>
          <div className="flex justify-between items-center text-white/60">
            <span>Fondo inicial configurado:</span>
            <span className="font-mono text-white/90 tabular-nums">{formatCOP(turno.fondoInicial)}</span>
          </div>
          <div className="flex justify-between items-center text-white/60">
            <span>Total ventas facturadas ({turno.cantidadVentas} comprobantes):</span>
            <span className="font-mono text-white/90 tabular-nums">{formatCOP(turno.totalVentas)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-white/5">
            <span className="font-semibold text-white/90">Efectivo esperado en caja:</span>
            <span className="font-mono font-bold text-sm text-emerald-400 tabular-nums">
              {formatCOP(esperadoEnCaja)}
            </span>
          </div>
        </div>

        {/* Campo de Efectivo Contado (opcional) */}
        <div>
          <label htmlFor="fondoFinal" className="block text-xs font-medium text-white/80 mb-1.5">
            Efectivo contado en caja (opcional)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40 text-sm font-mono">
              $
            </span>
            <input
              id="fondoFinal"
              type="number"
              min="0"
              step="100"
              value={efectivoContado}
              onChange={(e) => setEfectivoContado(e.target.value)}
              placeholder="Deja vacío si el cierre es sin arqueo físico"
              className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-mono text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <p className="text-[11px] text-white/40 mt-1">
            Si no cuentas el dinero ahora, el turno se cerrará sin arqueo y quedará registrado como tal.
          </p>

          {/* Vista previa de la diferencia */}
          {diferencia !== null && (
            <div className="mt-2 p-2.5 rounded-lg border flex items-center justify-between text-xs font-mono">
              <span className="text-white/60">Diferencia proyectada:</span>
              {diferencia === 0 ? (
                <span className="font-bold text-emerald-400">Cuadra exacto ($0)</span>
              ) : diferencia > 0 ? (
                <span className="font-bold text-amber-400">+{formatCOP(diferencia)} (Sobrante)</span>
              ) : (
                <span className="font-bold text-rose-400">{formatCOP(diferencia)} (Faltante)</span>
              )}
            </div>
          )}
        </div>

        {/* Campo de Motivo (obligatorio) */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="motivoCierre" className="block text-xs font-medium text-white/80">
              Motivo del cierre administrativo <span className="text-rose-400">*</span>
            </label>
            <span className="text-[10px] text-white/40 font-mono">
              {motivo.trim().length}/500 (mínimo 5)
            </span>
          </div>
          <textarea
            id="motivoCierre"
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Describe la justificación (ej. Abandono de caja, corte de energía, cambio de turno no asistido)..."
            className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
            required
            minLength={5}
            maxLength={500}
          />
          {motivo.length > 0 && motivo.trim().length < 5 && (
            <p className="text-[11px] text-rose-400 mt-1">
              El motivo debe tener al menos 5 caracteres.
            </p>
          )}
        </div>

        {/* Checkbox de confirmación explícita */}
        <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={confirmado}
            onChange={(e) => setConfirmado(e.target.checked)}
            className="mt-0.5 rounded border-white/20 bg-white/5 text-rose-600 focus:ring-rose-500 focus:ring-offset-0"
          />
          <span className="text-xs text-white/70 leading-snug">
            He verificado los datos y confirmo que deseo forzar el cierre de este turno bajo mi responsabilidad administrativa.
          </span>
        </label>

        {/* Banner de error si ocurrió fallo */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </form>
    </Modal>
  );
}
