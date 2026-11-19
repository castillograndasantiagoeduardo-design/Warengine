'use client';

import React from 'react';
import { formatCOP } from '@/lib/format/moneda';
import type { TurnoHistorialItem } from '../../types/branch-staff.types';

interface ShiftHistoryTableProps {
  turnos: TurnoHistorialItem[];
  onVerCorte: (turnoId: string) => void;
}

export function renderDiferenciaBadge(diferencia: number | null) {
  if (diferencia === null || diferencia === undefined) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
        Sin arqueo
      </span>
    );
  }
  if (diferencia === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        Cuadra ($0)
      </span>
    );
  }
  if (diferencia > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        +{formatCOP(diferencia)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
      {formatCOP(diferencia)}
    </span>
  );
}

function formatFechaHora(fechaIso: string): string {
  if (!fechaIso) return '—';
  const d = new Date(fechaIso);
  if (isNaN(d.getTime())) return fechaIso;
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ShiftHistoryTable({ turnos, onVerCorte }: ShiftHistoryTableProps) {
  return (
    <>
      {/* Vista de escritorio */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm text-white/80">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-white/50 border-b border-white/10">
            <tr>
              <th scope="col" className="px-4 py-3.5 font-medium">Cajero / Caja</th>
              <th scope="col" className="px-3 py-3.5 font-medium">Apertura</th>
              <th scope="col" className="px-3 py-3.5 font-medium">Cierre</th>
              <th scope="col" className="px-3 py-3.5 font-medium">Tipo Cierre</th>
              <th scope="col" className="px-3 py-3.5 text-right font-medium">Total Vendido</th>
              <th scope="col" className="px-3 py-3.5 text-right font-medium">Esperado</th>
              <th scope="col" className="px-3 py-3.5 text-right font-medium">Contado</th>
              <th scope="col" className="px-3 py-3.5 text-center font-medium">Diferencia</th>
              <th scope="col" className="px-4 py-3.5 text-right font-medium">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-transparent">
            {turnos.map((t) => (
              <tr
                key={t.id}
                className="hover:bg-white/[0.02] transition-colors group"
              >
                {/* Cajero / Caja */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="font-medium text-white group-hover:text-brand-300 transition-colors">
                    {t.cajeroNombre || 'Cajero'}
                  </div>
                  <div className="text-xs text-white/40 font-mono">
                    {t.cajaNombre || 'Caja 1'} · {t.cajeroEmail || t.usuarioId.slice(0, 8)}
                  </div>
                </td>

                {/* Apertura */}
                <td className="px-3 py-4 whitespace-nowrap text-xs font-mono text-white/70">
                  {formatFechaHora(t.fechaApertura)}
                </td>

                {/* Cierre */}
                <td className="px-3 py-4 whitespace-nowrap text-xs font-mono text-white/70">
                  {formatFechaHora(t.fechaCierre)}
                </td>

                {/* Tipo de Cierre */}
                <td className="px-3 py-4 whitespace-nowrap">
                  {t.tipoCierre === 'administrativo' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30">
                      <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Administrativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/5 text-white/60 border border-white/10">
                      Normal
                    </span>
                  )}
                </td>

                {/* Total Vendido */}
                <td className="px-3 py-4 whitespace-nowrap text-right font-mono font-medium text-white tabular-nums">
                  {formatCOP(t.totalVendido)}
                </td>

                {/* Esperado */}
                <td className="px-3 py-4 whitespace-nowrap text-right font-mono text-white/70 tabular-nums">
                  {formatCOP(t.efectivoEsperado)}
                </td>

                {/* Contado */}
                <td className="px-3 py-4 whitespace-nowrap text-right font-mono font-medium text-white tabular-nums">
                  {t.fondoFinal !== null ? formatCOP(t.fondoFinal) : <span className="text-white/30 italic">Sin conteo</span>}
                </td>

                {/* Diferencia */}
                <td className="px-3 py-4 whitespace-nowrap text-center">
                  {renderDiferenciaBadge(t.diferencia)}
                </td>

                {/* Acción */}
                <td className="px-4 py-4 whitespace-nowrap text-right">
                  <button
                    type="button"
                    onClick={() => onVerCorte(t.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-brand-300 hover:text-white bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 transition-colors"
                  >
                    Ver corte
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista móvil / tablet (tarjetas) */}
      <div className="lg:hidden space-y-3">
        {turnos.map((t) => (
          <div
            key={t.id}
            className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-medium text-white text-sm">{t.cajeroNombre || 'Cajero'}</h4>
                <p className="text-xs text-white/50 font-mono">
                  {t.cajaNombre || 'Caja 1'} · Cierre: {formatFechaHora(t.fechaCierre)}
                </p>
              </div>
              <div>
                {t.tipoCierre === 'administrativo' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30">
                    Administrativo
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-white/5 text-white/60 border border-white/10">
                    Normal
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-white/5 font-mono">
              <div>
                <span className="text-white/40 block text-[10px]">Vendido</span>
                <span className="text-white font-medium">{formatCOP(t.totalVendido)}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px]">Contado</span>
                <span className="text-white font-medium">
                  {t.fondoFinal !== null ? formatCOP(t.fondoFinal) : '—'}
                </span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px]">Diferencia</span>
                <div>{renderDiferenciaBadge(t.diferencia)}</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => onVerCorte(t.id)}
                className="w-full py-2 rounded-lg text-xs font-medium text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 transition-colors text-center"
              >
                Ver detalle del corte
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
