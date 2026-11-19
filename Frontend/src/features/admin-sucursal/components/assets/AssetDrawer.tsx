'use client';

import React, { useEffect, useState } from 'react';
import { formatCOP } from '@/lib/format/moneda';
import { branchAssetsService } from '../../api/branch-assets.service';
import type { ActivoSede, EstadoActivo } from '../../types/branch-assets.types';

interface AssetDrawerProps {
  activo: ActivoSede | null;
  onClose: () => void;
  onEditar: (activo: ActivoSede) => void;
  onAsignar: (activo: ActivoSede) => void;
  onDevolver: (activo: ActivoSede) => void;
  onDarBaja: (activo: ActivoSede) => void;
  onProgramarMantenimiento: (activo: ActivoSede) => void;
}

export function AssetDrawer({
  activo,
  onClose,
  onEditar,
  onAsignar,
  onDevolver,
  onDarBaja,
  onProgramarMantenimiento,
}: AssetDrawerProps) {
  const [detalle, setDetalle] = useState<ActivoSede | null>(activo);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => {
    setDetalle(activo);
    if (!activo?.id) return;

    let montado = true;
    setCargandoDetalle(true);
    branchAssetsService.obtenerActivo(activo.id)
      .then((res) => {
        if (montado) setDetalle(res);
      })
      .catch(() => {})
      .finally(() => {
        if (montado) setCargandoDetalle(false);
      });

    return () => {
      montado = false;
    };
  }, [activo]);

  if (!activo) return null;

  const current = detalle || activo;

  const renderBadgeEstado = (estado: EstadoActivo) => {
    switch (estado) {
      case 'disponible':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Disponible
          </span>
        );
      case 'asignado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-300 border border-sky-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            Asignado
          </span>
        );
      case 'mantenimiento':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            En mantenimiento
          </span>
        );
      case 'baja':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            De baja
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-neutral-900 border-l border-white/10 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-start justify-between bg-white/[0.02]">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-medium text-neutral-400 bg-white/5 px-2 py-0.5 rounded">
                  {current.codigoActivo}
                </span>
                {renderBadgeEstado(current.estado)}
              </div>
              <h2 className="text-lg font-semibold text-neutral-100">
                {current.nombre}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Ficha técnica */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                Ficha Técnica
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-neutral-500 mb-0.5">Categoría</div>
                  <div className="font-medium text-neutral-200">
                    {current.categoriaNombre || 'Sin categoría'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-neutral-500 mb-0.5">Condición física</div>
                  <div className="font-medium text-neutral-200">
                    {current.condicion || 'No especificada'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-neutral-500 mb-0.5">Fecha adquisición</div>
                  <div className="font-mono font-medium text-neutral-200">
                    {current.fechaAdquisicion || '—'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-neutral-500 mb-0.5">Valor adquisición</div>
                  <div className="font-mono font-semibold text-neutral-100">
                    {current.valorAdquisicion !== null ? formatCOP(current.valorAdquisicion) : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Custodia y ubicación */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                Custodia y Ubicación
              </h3>
              {current.custodioActual ? (
                <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/20 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Responsable:</span>
                    <span className="font-medium text-sky-200">
                      {current.custodioActual.nombre}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Tipo de custodia:</span>
                    <span className="capitalize text-neutral-300">
                      {current.custodioActual.tipo === 'empleado' ? 'Colaborador' : 'Área / Departamento'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Asignado el:</span>
                    <span className="font-mono text-neutral-300">
                      {current.custodioActual.fechaAsignacion ? new Date(current.custodioActual.fechaAsignacion).toLocaleDateString('es-CO') : '—'}
                    </span>
                  </div>
                  {current.custodioActual.fechaDevolucionEsperada && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Devolución esperada:</span>
                      <span className="font-mono text-amber-300">
                        {new Date(current.custodioActual.fechaDevolucionEsperada).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  )}
                  {current.custodioActual.observaciones && (
                    <div className="pt-2 border-t border-sky-500/10 text-neutral-400 italic">
                      "{current.custodioActual.observaciones}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-neutral-400">
                  <p>El activo se encuentra libre en la bodega general de la sucursal.</p>
                </div>
              )}
            </div>

            {/* Historial técnico */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Historial Técnico
                </h3>
                {cargandoDetalle && (
                  <span className="text-[10px] text-neutral-500 animate-pulse">Actualizando...</span>
                )}
              </div>

              {current.historialMantenimientos && current.historialMantenimientos.length > 0 ? (
                <div className="space-y-2.5">
                  {current.historialMantenimientos.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold capitalize ${m.tipo === 'correctivo' ? 'text-amber-300' : 'text-neutral-200'}`}>
                          Mantenimiento {m.tipo}
                        </span>
                        <span className="font-mono text-neutral-400">{m.fecha}</span>
                      </div>
                      {m.descripcion && (
                        <p className="text-neutral-300 text-xs">{m.descripcion}</p>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-white/5">
                        <span>{m.proveedorNombre ? `Proveedor: ${m.proveedorNombre}` : 'Interno'}</span>
                        <span className="font-mono text-neutral-200">
                          {m.costo !== null ? formatCOP(m.costo) : 'Sin costo'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-neutral-500 text-center">
                  Sin registros de mantenimiento técnico previos.
                </div>
              )}
            </div>
          </div>

          {/* Footer Quick Actions */}
          <div className="p-4 border-t border-white/5 bg-white/[0.02] flex flex-wrap gap-2">
            {current.estado === 'disponible' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAsignar(current);
                }}
                className="flex-1 px-3 py-2 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-semibold text-xs rounded-xl transition-all text-center"
              >
                Asignar custodio
              </button>
            )}

            {current.estado === 'asignado' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDevolver(current);
                }}
                className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs rounded-xl transition-all text-center"
              >
                Registrar devolución
              </button>
            )}

            {current.estado !== 'baja' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onProgramarMantenimiento(current);
                }}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-neutral-200 font-medium text-xs rounded-xl transition-all"
              >
                Mantenimiento
              </button>
            )}

            {current.estado !== 'baja' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditar(current);
                }}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-neutral-200 font-medium text-xs rounded-xl transition-all"
              >
                Editar
              </button>
            )}

            {current.estado !== 'baja' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDarBaja(current);
                }}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 font-medium text-xs rounded-xl transition-all"
              >
                Dar de baja
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
