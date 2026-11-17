'use client';

/**
 * /admin-sucursal/facturacion/alertas — Pestaña de Centro de Alertas Operativas de Caja.
 *
 * Visualiza y atiende incidencias emitidas desde los turnos de caja de la sucursal (RF-FMC-F1..F8).
 * Permite marcar como "visto" y como "atendido" con actualización reactiva local.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/autenticacion';
import { branchInvoicingService } from '@/features/admin-sucursal/api/branch-invoicing.service';
import {
  LoadingState,
  EmptyState,
  ErrorState,
} from '@/features/admin-sucursal/components/shared';
import { Bell, CheckCircle2, Eye, AlertCircle } from 'lucide-react';
import type {
  AlertaOperativa,
  EstadoAlertaOperativa,
} from '@/features/admin-sucursal/types/branch-invoicing.types';

export default function AlertasPage() {
  const { usuario } = useAuth();
  const sucursalId = usuario?.sucursalId || 1;

  const [alertas, setAlertas] = useState<AlertaOperativa[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<EstadoAlertaOperativa | 'todas'>('todas');
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  const cargarAlertas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await branchInvoicingService.listarAlertas(
        sucursalId,
        filtroEstado !== 'todas' ? { estado: filtroEstado } : undefined,
      );
      setAlertas(res);
    } catch (err: any) {
      console.error('[AlertasPage] Error al cargar alertas:', err);
      setError(err?.message || 'Error al consultar las alertas operativas.');
    } finally {
      setCargando(false);
    }
  }, [sucursalId, filtroEstado]);

  useEffect(() => {
    cargarAlertas();
  }, [cargarAlertas]);

  const handleCambiarEstado = async (
    id: string,
    nuevoEstado: 'visto' | 'atendido',
  ) => {
    setActualizandoId(id);
    try {
      const actualizada = await branchInvoicingService.cambiarEstadoAlerta(
        id,
        nuevoEstado,
      );
      setAlertas((prev) =>
        prev.map((a) => (a.id === id ? { ...a, estado: actualizada.estado } : a)),
      );
    } catch (err: any) {
      console.error('[AlertasPage] Error al cambiar estado de alerta:', err);
      alert(err?.message || 'No se pudo actualizar el estado de la alerta.');
    } finally {
      setActualizandoId(null);
    }
  };

  const estadosPills: Array<{ id: EstadoAlertaOperativa | 'todas'; label: string }> = [
    { id: 'todas', label: 'Todas' },
    { id: 'pendiente', label: 'Pendientes' },
    { id: 'visto', label: 'En Revisión (Visto)' },
    { id: 'atendido', label: 'Atendidas' },
  ];

  return (
    <div className="space-y-4">
      {/* Selector de Pestañas / Filtro de Estado */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] vidrio">
        <div className="flex flex-wrap items-center gap-1.5">
          {estadosPills.map((pill) => {
            const activo = filtroEstado === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFiltroEstado(pill.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activo
                    ? 'bg-[#e3b341] text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-slate-400 font-mono">
          {alertas.length} alerta(s)
        </span>
      </div>

      {/* Contenido Principal */}
      {cargando ? (
        <LoadingState title="Cargando alertas operativas..." />
      ) : error ? (
        <ErrorState
          title="Error al cargar alertas"
          message={error}
          onRetry={cargarAlertas}
        />
      ) : alertas.length === 0 ? (
        <EmptyState
          title="No hay alertas en este estado"
          description="No se encontraron alertas operativas registradas con el filtro seleccionado."
        />
      ) : (
        <div className="space-y-3">
          {alertas.map((alerta) => {
            const esUrgente = alerta.prioridad === 'urgente';
            const esAtendida = alerta.estado === 'atendido';
            const esVisto = alerta.estado === 'visto';
            const estaProcesando = actualizandoId === alerta.id;

            return (
              <div
                key={alerta.id}
                className={`p-4 rounded-2xl border transition-all vidrio ${
                  esUrgente
                    ? 'border-red-500/30 bg-red-500/[0.03]'
                    : 'border-white/[0.08] bg-white/[0.02]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${
                          esUrgente
                            ? 'bg-red-500/20 text-red-300 border-red-500/40'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}
                      >
                        {alerta.prioridad}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${
                          esAtendida
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : esVisto
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {alerta.estado}
                      </span>

                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(alerta.fechaCreacion).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {esUrgente ? (
                        <AlertCircle size={16} className="text-red-400 shrink-0" aria-hidden="true" />
                      ) : (
                        <Bell size={16} className="text-[#e3b341] shrink-0" aria-hidden="true" />
                      )}
                      <span>{alerta.motivo}</span>
                    </h3>

                    {alerta.descripcion && (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {alerta.descripcion}
                      </p>
                    )}

                    <div className="pt-1 text-[11px] text-slate-400">
                      <span>Emitida por: </span>
                      <strong className="text-slate-300">
                        {alerta.usuarioNombre || alerta.usuarioEmail || 'Cajero de turno'}
                      </strong>
                    </div>
                  </div>

                  {/* Acciones de la Alerta */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {!esAtendida && alerta.estado === 'pendiente' && (
                      <button
                        type="button"
                        onClick={() => handleCambiarEstado(alerta.id, 'visto')}
                        disabled={estaProcesando}
                        aria-label={`Marcar alerta "${alerta.motivo}" como vista`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-500/30 text-sky-300 hover:bg-sky-500/10 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
                      >
                        <Eye size={14} aria-hidden="true" />
                        <span>Marcar Visto</span>
                      </button>
                    )}

                    {!esAtendida && (
                      <button
                        type="button"
                        onClick={() => handleCambiarEstado(alerta.id, 'atendido')}
                        disabled={estaProcesando}
                        aria-label={`Marcar alerta "${alerta.motivo}" como atendida`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                      >
                        <CheckCircle2 size={14} aria-hidden="true" />
                        <span>Atender</span>
                      </button>
                    )}

                    {esAtendida && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 size={14} aria-hidden="true" />
                        <span>Resuelta</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
