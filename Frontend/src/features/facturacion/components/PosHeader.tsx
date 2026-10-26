'use client';

/**
 * PosHeader.tsx — Barra superior de control de la Terminal POS de WarEngine.
 *
 * Muestra la identidad de la sucursal, datos del cajero, estado de la caja
 * en tiempo real y accesos rápidos a alertas, historial y cierre de turno.
 */

import React from 'react';
import type { TurnoCajaDto } from '../types/pos.types';

interface PosHeaderProps {
  usuarioNombre: string;
  usuarioEmail: string;
  sucursalNombre: string;
  turno: TurnoCajaDto | null;
  onAbrirModalTurno: () => void;
  onAbrirModalAlerta: () => void;
  onAbrirHistorial: () => void;
  onLogout: () => void;
}

export function PosHeader({
  usuarioNombre,
  usuarioEmail,
  sucursalNombre,
  turno,
  onAbrirModalTurno,
  onAbrirModalAlerta,
  onAbrirHistorial,
  onLogout,
}: PosHeaderProps) {
  const tieneTurnoAbierto = Boolean(
    turno && (turno.estaAbierto === true || turno.fechaCierre === null),
  );

  const formatoCOP = (monto: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(monto);

  const horaApertura = turno?.fechaApertura
    ? new Date(turno.fechaApertura).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <header className="h-16 px-4 bg-[#0a1124] border-b border-white/10 flex items-center justify-between select-none shadow-md">
      {/* Lado izquierdo: Marca y Sucursal */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#e3b341] to-[#b88a1f] flex items-center justify-center shadow-lg shadow-[#e3b341]/20">
          <span className="font-[family-name:var(--font-anton)] text-black text-xl tracking-tighter">W</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-[family-name:var(--font-anton)] text-[#e3b341] text-lg tracking-wider uppercase">
              WarEngine POS
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#14213D] border border-white/10 text-[10px] text-white/80 font-medium">
              {sucursalNombre || 'Sede Principal'}
            </span>
          </div>
          <p className="text-[11px] text-white/50 leading-none">
            Operador: <span className="text-white/80 font-medium">{usuarioNombre || usuarioEmail}</span>
          </p>
        </div>
      </div>

      {/* Centro: Estado del Turno de Caja */}
      <div className="flex items-center gap-3">
        {tieneTurnoAbierto ? (
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#14213d]/80 border border-emerald-500/30">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 font-[family-name:var(--font-pixelify)] uppercase tracking-wide">
                  Caja Abierta
                </span>
                <span className="text-[10px] text-white/50">desde {horaApertura}</span>
              </div>
              <p className="text-[10px] text-white/60">
                Fondo base: <span className="text-white font-medium">{formatoCOP(turno?.fondoInicial || 0)}</span>
              </p>
            </div>
            <button
              onClick={onAbrirModalTurno}
              className="ml-2 px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-[11px] font-[family-name:var(--font-pixelify)] uppercase cursor-pointer transition-colors"
              title="Cerrar turno de caja y realizar arqueo"
            >
              Cerrar Turno
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            <span className="text-xs font-bold text-amber-400 font-[family-name:var(--font-pixelify)] uppercase tracking-wide">
              Turno No Iniciado
            </span>
            <button
              onClick={onAbrirModalTurno}
              className="px-3 py-1 rounded-lg bg-[#e3b341] hover:bg-[#e9b949] text-black text-xs font-bold font-[family-name:var(--font-pixelify)] uppercase cursor-pointer transition-all shadow-[0_2px_0_#b88a1f] active:translate-y-0.5 active:shadow-none"
            >
              Abrir Turno
            </button>
          </div>
        )}
      </div>

      {/* Lado derecho: Acciones de soporte y sesión */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAbrirHistorial}
          className="px-3 py-1.5 rounded-xl bg-[#14213D] hover:bg-[#1a2b50] border border-white/10 text-white/80 hover:text-white text-xs font-[family-name:var(--font-pixelify)] uppercase cursor-pointer transition-colors flex items-center gap-1.5"
          title="Historial de comprobantes emitidos en el turno [F8]"
        >
          <span>📜</span>
          <span className="hidden sm:inline">Historial</span>
          <span className="text-[10px] text-white/40 ml-0.5">[F8]</span>
        </button>

        <button
          onClick={onAbrirModalAlerta}
          className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-[family-name:var(--font-pixelify)] uppercase cursor-pointer transition-colors flex items-center gap-1.5"
          title="Emitir alerta operativa al Administrador de Sucursal [F9]"
        >
          <span>🔔</span>
          <span className="hidden sm:inline">Alertar Admin</span>
          <span className="text-[10px] text-amber-300/50 ml-0.5">[F9]</span>
        </button>

        <button
          onClick={onLogout}
          className="px-3 py-1.5 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-500/10 text-xs font-[family-name:var(--font-pixelify)] uppercase cursor-pointer transition-colors ml-1"
          title="Cerrar sesión del cajero"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
