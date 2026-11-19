'use client';

import React from 'react';
import { formatCOP } from '@/lib/format/moneda';
import type { ActivoSede, EstadoActivo } from '../../types/branch-assets.types';

interface AssetTableProps {
  activos: ActivoSede[];
  cargando: boolean;
  onVerDetalle: (activo: ActivoSede) => void;
  onEditar: (activo: ActivoSede) => void;
  onAsignar: (activo: ActivoSede) => void;
  onDevolver: (activo: ActivoSede) => void;
  onDarBaja: (activo: ActivoSede) => void;
}

export function AssetTable({
  activos,
  cargando,
  onVerDetalle,
  onEditar,
  onAsignar,
  onDevolver,
  onDarBaja,
}: AssetTableProps) {
  if (cargando) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-3" />
        <p className="text-sm text-neutral-400">Cargando inventario de activos...</p>
      </div>
    );
  }

  if (activos.length === 0) {
    return (
      <div className="py-16 text-center px-4">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-white/5 flex items-center justify-center text-neutral-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-neutral-200">No se encontraron activos</h3>
        <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
          No hay activos registrados que coincidan con los criterios de búsqueda aplicados.
        </p>
      </div>
    );
  }

  const renderBadgeEstado = (estado: EstadoActivo) => {
    switch (estado) {
      case 'disponible':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Disponible
          </span>
        );
      case 'asignado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-300 border border-sky-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            Asignado
          </span>
        );
      case 'mantenimiento':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            En mantenimiento
          </span>
        );
      case 'baja':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            De baja
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
            <th className="py-3 px-4">Activo / Código</th>
            <th className="py-3 px-4">Categoría</th>
            <th className="py-3 px-4">Custodio / Ubicación</th>
            <th className="py-3 px-4">Estado</th>
            <th className="py-3 px-4 text-right">Valor Adquisición</th>
            <th className="py-3 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-sm">
          {activos.map((activo) => (
            <tr
              key={activo.id}
              className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
              onClick={() => onVerDetalle(activo)}
            >
              {/* Activo / Código */}
              <td className="py-3.5 px-4">
                <div className="font-medium text-neutral-100 group-hover:text-white transition-colors">
                  {activo.nombre}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs text-neutral-400">
                    {activo.codigoActivo}
                  </span>
                  {activo.condicion && (
                    <>
                      <span className="text-neutral-600">•</span>
                      <span className="text-xs text-neutral-400">{activo.condicion}</span>
                    </>
                  )}
                </div>
              </td>

              {/* Categoría */}
              <td className="py-3.5 px-4">
                <span className="text-xs text-neutral-300">
                  {activo.categoriaNombre || 'Sin categoría'}
                </span>
              </td>

              {/* Custodio / Ubicación */}
              <td className="py-3.5 px-4">
                {activo.custodioActual ? (
                  <div>
                    <div className="text-xs font-medium text-neutral-200">
                      {activo.custodioActual.nombre}
                    </div>
                    <div className="text-[11px] text-neutral-500 capitalize">
                      {activo.custodioActual.tipo === 'empleado' ? 'Colaborador' : 'Área'}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-neutral-500 italic">Bodega general</span>
                )}
              </td>

              {/* Estado */}
              <td className="py-3.5 px-4">
                {renderBadgeEstado(activo.estado)}
              </td>

              {/* Valor Adquisición */}
              <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-neutral-200">
                {activo.valorAdquisicion !== null ? formatCOP(activo.valorAdquisicion) : '—'}
              </td>

              {/* Acciones */}
              <td
                className="py-3.5 px-4 text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-end gap-1">
                  {/* Asignar / Devolver */}
                  {activo.estado === 'disponible' && (
                    <button
                      type="button"
                      onClick={() => onAsignar(activo)}
                      title="Asignar custodio"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-sky-300 hover:bg-sky-500/10 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </button>
                  )}
                  {activo.estado === 'asignado' && (
                    <button
                      type="button"
                      onClick={() => onDevolver(activo)}
                      title="Registrar devolución"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}

                  {/* Editar */}
                  {activo.estado !== 'baja' && (
                    <button
                      type="button"
                      onClick={() => onEditar(activo)}
                      title="Editar activo"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/5 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}

                  {/* Dar de baja */}
                  {activo.estado !== 'baja' && (
                    <button
                      type="button"
                      onClick={() => onDarBaja(activo)}
                      title="Dar de baja"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
