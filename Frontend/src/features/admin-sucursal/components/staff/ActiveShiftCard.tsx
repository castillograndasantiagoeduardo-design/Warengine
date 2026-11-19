'use client';

import React, { useEffect, useState } from 'react';
import { formatCOP } from '@/lib/format/moneda';
import type { TurnoCajaActivo } from '../../types/branch-staff.types';

interface ActiveShiftCardProps {
  turno: TurnoCajaActivo;
  puedeCerrarAdministrativo: boolean;
  onSolicitarCierre: (turno: TurnoCajaActivo) => void;
}

export function calcularTiempoTranscurrido(fechaApertura: string | Date): string {
  if (!fechaApertura) return '—';
  const inicio = new Date(fechaApertura).getTime();
  const ahora = Date.now();
  const diffMs = Math.max(0, ahora - inicio);

  const minutosTotales = Math.floor(diffMs / (1000 * 60));
  const horas = Math.floor(minutosTotales / 60);
  const minutos = minutosTotales % 60;

  if (horas === 0 && minutos === 0) return '< 1m';
  if (horas === 0) return `${minutos}m`;
  return `${horas}h ${minutos}m`;
}

function obtenerIniciales(nombre?: string | null): string {
  if (!nombre) return 'CA';
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

export function ActiveShiftCard({
  turno,
  puedeCerrarAdministrativo,
  onSolicitarCierre,
}: ActiveShiftCardProps) {
  // Actualización del tiempo transcurrido en vivo
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(() =>
    calcularTiempoTranscurrido(turno.fechaApertura),
  );

  useEffect(() => {
    setTiempoTranscurrido(calcularTiempoTranscurrido(turno.fechaApertura));
    const intervalo = setInterval(() => {
      setTiempoTranscurrido(calcularTiempoTranscurrido(turno.fechaApertura));
    }, 60_000);
    return () => clearInterval(intervalo);
  }, [turno.fechaApertura]);

  const horaAperturaFormateada = turno.fechaApertura
    ? new Date(turno.fechaApertura).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  return (
    <div className="vidrio p-6 rounded-2xl border border-white/10 flex flex-col justify-between gap-6 relative overflow-hidden transition-all hover:border-white/20">
      {/* Encabezado del turno */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-300 font-bold flex items-center justify-center text-sm tracking-wider shrink-0">
            {obtenerIniciales(turno.cajeroNombre || turno.usuarioNombre)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-base">
                {turno.cajeroNombre || turno.usuarioNombre || 'Cajero en turno'}
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                En línea
              </span>
            </div>
            <p className="text-xs text-white/50 mt-0.5 font-mono">
              Caja 1 · {turno.cajeroEmail || `ID: ${turno.usuarioId.slice(0, 8)}`}
            </p>
          </div>
        </div>

        {/* Ticker de tiempo transcurrido */}
        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white/80">
            <svg className="w-3.5 h-3.5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{tiempoTranscurrido}</span>
          </div>
          <span className="block text-[11px] text-white/40 mt-1">
            Desde las {horaAperturaFormateada}
          </span>
        </div>
      </div>

      {/* Métricas clave */}
      <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <div>
          <span className="text-xs text-white/40 block">Ventas Turno</span>
          <span className="text-sm md:text-base font-mono font-bold text-white tabular-nums">
            {formatCOP(turno.totalVentas)}
          </span>
        </div>
        <div>
          <span className="text-xs text-white/40 block">Facturas</span>
          <span className="text-sm md:text-base font-mono font-bold text-white tabular-nums">
            {turno.cantidadVentas}
          </span>
        </div>
        <div>
          <span className="text-xs text-emerald-400/80 block">Efectivo Esperado</span>
          <span className="text-sm md:text-base font-mono font-bold text-emerald-400 tabular-nums">
            {formatCOP(turno.efectivoEsperado ?? (turno.fondoInicial + turno.totalVentas))}
          </span>
        </div>
      </div>

      {/* Pie y Acción */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="text-xs text-white/40">
          Fondo inicial: <strong className="font-mono text-white/70">{formatCOP(turno.fondoInicial)}</strong>
        </div>

        {puedeCerrarAdministrativo && (
          <button
            type="button"
            onClick={() => onSolicitarCierre(turno)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Cierre administrativo</span>
          </button>
        )}
      </div>
    </div>
  );
}
