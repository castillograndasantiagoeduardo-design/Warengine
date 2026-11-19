'use client';

/**
 * /admin-sucursal/personal/turnos — Pestaña 2: Turnos activos en tiempo real y cierre administrativo.
 */

import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import {
  LoadingState,
  EmptyState,
  ErrorState,
} from '@/features/admin-sucursal/components/shared';
import {
  ActiveShiftCard,
  AdministrativeCloseModal,
} from '@/features/admin-sucursal/components/staff';
import { useActiveShifts } from '@/features/admin-sucursal/hooks/useActiveShifts';
import type { CierreAdministrativoInput } from '@/features/admin-sucursal/types/branch-staff.types';

export default function ActiveShiftsPage() {
  const {
    turnos,
    totalTurnos,
    cargando,
    error,
    recargar,
    puedeCerrarAdministrativo,
    turnoParaCierre,
    guardandoCierre,
    errorCierre,
    abrirCierre,
    cerrarModalCierre,
    ejecutarCierreAdministrativo,
  } = useActiveShifts();

  const [notificacion, setNotificacion] = useState<string | null>(null);
  const [actualizandoManual, setActualizandoManual] = useState(false);

  const handleRefrescar = async () => {
    setActualizandoManual(true);
    try {
      await recargar();
    } finally {
      setTimeout(() => setActualizandoManual(false), 500);
    }
  };

  const handleConfirmarCierre = async (datos: CierreAdministrativoInput) => {
    try {
      await ejecutarCierreAdministrativo(datos);
      setNotificacion('El turno fue cerrado administrativamente con éxito.');
      setTimeout(() => setNotificacion(null), 4000);
    } catch {
      // Error manejado en hook / modal
    }
  };

  return (
    <div className="space-y-6">
      {/* Notificación de éxito */}
      {notificacion && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm flex items-center justify-between shadow-lg shadow-emerald-950/20 animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{notificacion}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotificacion(null)}
            className="text-emerald-400/60 hover:text-emerald-300 text-xs px-2 py-1 rounded"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Cabecera de la sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">Turnos Abiertos</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-brand-500/20 text-brand-300 border border-brand-500/40">
              {totalTurnos}
            </span>
          </div>
          <span className="text-xs text-white/40 hidden sm:inline">
            Monitoreo en tiempo real de cajas de la sede
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleRefrescar}
            disabled={cargando || actualizandoManual}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-2 disabled:opacity-50"
            aria-label="Actualizar turnos activos"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-brand-400 ${
                actualizandoManual || cargando ? 'animate-spin' : ''
              }`}
            />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Estados y contenido */}
      {cargando && turnos.length === 0 ? (
        <LoadingState rows={4} />
      ) : error ? (
        <ErrorState
          title="Error al consultar turnos activos"
          message={error}
          onRetry={recargar}
        />
      ) : turnos.length === 0 ? (
        <EmptyState
          title="Todos los turnos están cerrados"
          description="No hay cajas ni turnos POS activos en este momento. Las ventas se registrarán cuando un cajero abra su turno."
          icon={<CheckCircle2 className="w-8 h-8 text-emerald-400" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {turnos.map((turno) => (
            <ActiveShiftCard
              key={turno.id}
              turno={turno}
              puedeCerrarAdministrativo={puedeCerrarAdministrativo}
              onSolicitarCierre={abrirCierre}
            />
          ))}
        </div>
      )}

      {/* Modal de Cierre Administrativo */}
      <AdministrativeCloseModal
        open={Boolean(turnoParaCierre)}
        onClose={cerrarModalCierre}
        turno={turnoParaCierre}
        onConfirm={handleConfirmarCierre}
        guardando={guardandoCierre}
        error={errorCierre}
      />
    </div>
  );
}
