'use client';

/**
 * CreditosB2BPendientesPanel.tsx — Bandeja exclusiva del Super Admin para revisar
 * la ganancia neta declarada por nuevas empresas B2B y aprobar o rechazar el cupo de crédito.
 */

import React, { useCallback, useEffect, useState } from 'react';
import type { ClienteDto } from '@warengine/contracts';
import { apiClient, ApiError } from '@/lib/api';

const RIESGO_BADGE = {
  bajo: 'bg-green-500/12 text-green-300 ring-green-500/30',
  medio: 'bg-amber-500/12 text-amber-300 ring-amber-500/30',
  alto: 'bg-red-500/12 text-red-300 ring-red-500/30',
} as const;

export function CreditosB2BPendientesPanel() {
  const [pendientes, setPendientes] = useState<ClienteDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeOk, setMensajeOk] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [cuposEditados, setCuposEditados] = useState<Record<string, string>>({});
  const [motivos, setMotivos] = useState<Record<string, string>>({});

  const cargar = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<ClienteDto[]>('/ventas/clientes/creditos-pendientes');
      const lista = Array.isArray(data) ? data : [];
      setPendientes(lista);
      const iniciales: Record<string, string> = {};
      for (const c of lista) {
        iniciales[c.id] = String(c.cupoCreditoSugerido ?? 0);
      }
      setCuposEditados(iniciales);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudieron cargar las solicitudes de crédito B2B.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const decidir = async (cliente: ClienteDto, decision: 'aprobar' | 'rechazar') => {
    setError(null);
    setMensajeOk(null);
    const cupo = Number(cuposEditados[cliente.id] ?? cliente.cupoCreditoSugerido ?? 0);
    const motivo = (motivos[cliente.id] ?? '').trim();

    if (decision === 'aprobar' && (!cupo || cupo <= 0)) {
      setError('Indica un cupo aprobado mayor a $0 para liberar el crédito.');
      return;
    }
    if (decision === 'rechazar' && motivo.length < 5) {
      setError('Para rechazar el crédito debes escribir un motivo de al menos 5 caracteres.');
      return;
    }

    setProcesandoId(cliente.id);
    try {
      await apiClient.put(`/ventas/clientes/${cliente.id}/credito`, {
        decision,
        cupoAprobado: decision === 'aprobar' ? cupo : 0,
        plazoCreditoDias: cliente.plazoCreditoDias ?? 30,
        motivo: motivo || undefined,
      });
      setMensajeOk(
        decision === 'aprobar'
          ? `Crédito aprobado para ${cliente.nombreRazonSocial} por $${cupo.toLocaleString('es-CO')} COP.`
          : `Solicitud de crédito rechazada para ${cliente.nombreRazonSocial}.`,
      );
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al registrar la decisión de crédito.');
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div className="vidrio p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h3 className="text-base font-titulos font-semibold text-text">
            Solicitudes de Crédito B2B Pendientes (Super Admin)
          </h3>
          <p className="text-xs text-text-muted">
            Ninguna empresa nueva obtiene crédito automáticamente. Revisa su ganancia neta y aprueba o rechaza el cupo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void cargar()}
          className="px-3 py-1.5 rounded-xl superficie-control border border-border text-xs text-text cursor-pointer"
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/12 border border-red-500/30 text-red-300 text-xs">
          {error}
        </div>
      )}
      {mensajeOk && (
        <div className="p-3 rounded-xl bg-green-500/12 border border-green-500/30 text-green-300 text-xs">
          {mensajeOk}
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-text-muted py-8 text-center">Cargando solicitudes de crédito...</p>
      ) : pendientes.length === 0 ? (
        <p className="text-xs text-text-muted py-8 text-center">
          No hay empresas B2B pendientes de aprobación de crédito.
        </p>
      ) : (
        <div className="space-y-4">
          {pendientes.map((cli) => {
            const riesgo = cli.nivelRiesgoCredito ?? 'medio';
            const ocupado = procesandoId === cli.id;

            return (
              <div
                key={cli.id}
                className="p-4 rounded-xl superficie-control border border-border space-y-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-text">{cli.nombreRazonSocial}</h4>
                    <p className="text-text-muted font-mono text-[11px]">
                      {cli.tipoDocumento} {cli.numeroDocumento} • Tel: {cli.telefono || 'N/A'}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] ring-1 ring-inset uppercase ${RIESGO_BADGE[riesgo]}`}
                  >
                    Riesgo {riesgo}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-bg/50 border border-border">
                  <div>
                    <span className="text-[11px] text-text-muted block">Ganancia neta mensual</span>
                    <span className="text-sm font-semibold tabular-nums text-text">
                      ${(cli.gananciaNetaMensual ?? 0).toLocaleString('es-CO')} COP
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-text-muted block">Cupo sugerido (reglas)</span>
                    <span className="text-sm font-semibold tabular-nums text-brand-300">
                      ${(cli.cupoCreditoSugerido ?? 0).toLocaleString('es-CO')} COP
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-text-muted block">Antigüedad / Plazo</span>
                    <span className="text-sm font-medium tabular-nums text-text">
                      {cli.antiguedadEmpresaMeses ?? 'N/D'} meses • {cli.plazoCreditoDias ?? 30} días
                    </span>
                  </div>
                </div>

                {cli.observacionFinanciera && (
                  <p className="text-[11px] text-text-muted">
                    Respaldo declarado: {cli.observacionFinanciera}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                  <div>
                    <label className="block text-[11px] text-text-muted mb-1">
                      Cupo final a aprobar (COP)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={100000}
                      value={cuposEditados[cli.id] ?? ''}
                      onChange={(e) =>
                        setCuposEditados((prev) => ({ ...prev, [cli.id]: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl superficie-control border border-border text-text tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-text-muted mb-1">
                      Nota / Motivo de decisión
                    </label>
                    <input
                      type="text"
                      placeholder="Obligatorio si rechazas; opcional al aprobar..."
                      value={motivos[cli.id] ?? ''}
                      onChange={(e) => setMotivos((prev) => ({ ...prev, [cli.id]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl superficie-control border border-border text-text"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() => void decidir(cli, 'rechazar')}
                    className="px-4 py-2 rounded-xl border border-red-500/40 text-red-300 hover:bg-red-500/15 font-medium cursor-pointer disabled:opacity-50"
                  >
                    Rechazar crédito
                  </button>
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() => void decidir(cli, 'aprobar')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 text-btn-primario-texto font-medium cursor-pointer disabled:opacity-50"
                  >
                    {ocupado ? 'Guardando...' : 'Aprobar y liberar cupo'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
