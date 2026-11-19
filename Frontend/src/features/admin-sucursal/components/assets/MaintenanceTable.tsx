'use client';

import React from 'react';
import { formatCOP } from '@/lib/format/moneda';
import type { MantenimientoSede } from '../../types/branch-assets.types';

interface MaintenanceTableProps {
  mantenimientos: MantenimientoSede[];
  cargando: boolean;
  onFinalizar: (mantenimiento: MantenimientoSede) => void;
}

export function MaintenanceTable({
  mantenimientos,
  cargando,
  onFinalizar,
}: MaintenanceTableProps) {
  if (cargando) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-3" />
        <p className="text-sm text-neutral-400">Cargando registros de mantenimiento...</p>
      </div>
    );
  }

  if (mantenimientos.length === 0) {
    return (
      <div className="py-16 text-center px-4">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-white/5 flex items-center justify-center text-neutral-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-neutral-200">No hay mantenimientos</h3>
        <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
          No se encontraron servicios técnicos registrados con los filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
            <th className="py-3 px-4">Activo</th>
            <th className="py-3 px-4">Tipo</th>
            <th className="py-3 px-4">Fecha Inicio / Fin</th>
            <th className="py-3 px-4">Proveedor / Taller</th>
            <th className="py-3 px-4 text-right">Costo</th>
            <th className="py-3 px-4">Estado</th>
            <th className="py-3 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-sm">
          {mantenimientos.map((m) => (
            <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
              {/* Activo */}
              <td className="py-3.5 px-4">
                <div className="font-medium text-neutral-100">{m.activoNombre}</div>
                <div className="font-mono text-xs text-neutral-400 mt-0.5">
                  {m.activoCodigo}
                </div>
              </td>

              {/* Tipo */}
              <td className="py-3.5 px-4">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    m.tipo === 'correctivo'
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      : 'bg-neutral-500/10 text-neutral-300 border border-neutral-500/20'
                  }`}
                >
                  {m.tipo}
                </span>
              </td>

              {/* Fecha Inicio / Fin */}
              <td className="py-3.5 px-4">
                <div className="font-mono text-xs text-neutral-200">{m.fecha}</div>
                <div className="font-mono text-[11px] text-neutral-500 mt-0.5">
                  {m.fechaFin ? `Fin: ${m.fechaFin}` : 'En ejecución'}
                </div>
              </td>

              {/* Proveedor / Taller */}
              <td className="py-3.5 px-4">
                <div className="text-xs text-neutral-300">
                  {m.proveedorNombre || 'Servicio técnico interno'}
                </div>
                {m.descripcion && (
                  <div className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                    {m.descripcion}
                  </div>
                )}
              </td>

              {/* Costo */}
              <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-neutral-200">
                {m.costo !== null ? formatCOP(m.costo) : '—'}
              </td>

              {/* Estado */}
              <td className="py-3.5 px-4">
                {m.enCurso ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    En curso
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Finalizado
                  </span>
                )}
              </td>

              {/* Acciones */}
              <td className="py-3.5 px-4 text-right">
                {m.enCurso && (
                  <button
                    type="button"
                    onClick={() => onFinalizar(m)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30 text-neutral-300 text-xs font-semibold rounded-lg border border-white/10 transition-all"
                  >
                    Finalizar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
