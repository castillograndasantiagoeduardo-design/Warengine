'use client';

/**
 * usePosTurno.ts — Hook para el ciclo de vida del turno de caja del cajero.
 *
 * Principio SOLID:
 * - Single Responsibility: Gestiona exclusivamente el estado de apertura,
 *   cierre y consulta del turno activo del operador.
 */

import { useState, useEffect, useCallback } from 'react';
import { posService } from '../api';
import type { TurnoCajaDto } from '../types/pos.types';

export function usePosTurno() {
  const [turno, setTurno] = useState<TurnoCajaDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const cargarTurnoActual = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const actual = await posService.obtenerTurnoActual();
      setTurno(actual);
    } catch (err: any) {
      setError(err?.message || 'Error al consultar el turno de caja.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarTurnoActual();
  }, [cargarTurnoActual]);

  const abrirTurno = async (fondoInicial: number): Promise<TurnoCajaDto> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const nuevoTurno = await posService.abrirTurno(fondoInicial);
      setTurno(nuevoTurno);
      return nuevoTurno;
    } catch (err: any) {
      const msg = err?.message || 'No se pudo abrir el turno de caja.';
      setError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const cerrarTurno = async (fondoFinal: number): Promise<TurnoCajaDto> => {
    if (!turno) {
      throw new Error('No hay un turno de caja activo para cerrar.');
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const turnoCerrado = await posService.cerrarTurno(turno.id, fondoFinal);
      setTurno(null);
      return turnoCerrado;
    } catch (err: any) {
      const msg = err?.message || 'No se pudo cerrar el turno de caja.';
      setError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    turno,
    tieneTurnoAbierto: Boolean(turno && turno.estaAbierto),
    isLoading,
    isSubmitting,
    error,
    recargarTurno: cargarTurnoActual,
    abrirTurno,
    cerrarTurno,
  };
}
