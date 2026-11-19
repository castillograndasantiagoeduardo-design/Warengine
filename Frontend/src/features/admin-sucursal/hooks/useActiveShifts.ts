'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePermissions } from '@/features/autenticacion';
import { branchStaffService } from '../api/branch-staff.service';
import type { CierreAdministrativoInput, TurnoCajaActivo } from '../types/branch-staff.types';

export function useActiveShifts() {
  const { usuario, tienePermiso } = usePermissions();
  const sucursalId = usuario?.sucursalId ?? 1;

  const [turnos, setTurnos] = useState<TurnoCajaActivo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de Cierre Administrativo
  const [turnoParaCierre, setTurnoParaCierre] = useState<TurnoCajaActivo | null>(null);
  const [guardandoCierre, setGuardandoCierre] = useState(false);
  const [errorCierre, setErrorCierre] = useState<string | null>(null);

  const cargarTurnos = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    setError(null);
    try {
      const datos = await branchStaffService.listarTurnosActivos(sucursalId);
      setTurnos(datos);
    } catch (err: any) {
      if (!silencioso) {
        setError(err?.message || 'Error al consultar los turnos activos de la sede.');
      }
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [sucursalId]);

  // Carga inicial y auto-refresh cada 60s
  useEffect(() => {
    cargarTurnos();
    const intervalo = setInterval(() => {
      cargarTurnos(true);
    }, 60_000);
    return () => clearInterval(intervalo);
  }, [cargarTurnos]);

  // Permiso para cierre administrativo
  const puedeCerrarAdministrativo = Boolean(
    tienePermiso('caja:cierre-administrativo') ||
    usuario?.rolId === 1 ||
    usuario?.rolId === 2,
  );

  const abrirCierre = (turno: TurnoCajaActivo) => {
    setErrorCierre(null);
    setTurnoParaCierre(turno);
  };

  const cerrarModalCierre = () => {
    if (guardandoCierre) return;
    setTurnoParaCierre(null);
    setErrorCierre(null);
  };

  const ejecutarCierreAdministrativo = async (datos: CierreAdministrativoInput) => {
    if (!turnoParaCierre) return;
    setGuardandoCierre(true);
    setErrorCierre(null);
    try {
      await branchStaffService.cerrarTurnoAdministrativo(turnoParaCierre.id, datos);
      setTurnoParaCierre(null);
      await cargarTurnos();
    } catch (err: any) {
      setErrorCierre(err?.message || 'Ocurrió un error al ejecutar el cierre administrativo.');
      throw err;
    } finally {
      setGuardandoCierre(false);
    }
  };

  return {
    turnos,
    totalTurnos: turnos.length,
    cargando,
    error,
    recargar: () => cargarTurnos(false),
    puedeCerrarAdministrativo,
    turnoParaCierre,
    guardandoCierre,
    errorCierre,
    abrirCierre,
    cerrarModalCierre,
    ejecutarCierreAdministrativo,
  };
}
