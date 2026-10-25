'use client';

/**
 * useCambiarEstadoSucursal.ts — Activar / inactivar una sucursal con confirmación (RF-ADM-C17).
 *
 * Reglas del backend que se reflejan en la UI:
 * - La Sede Principal (id 1) no puede inactivarse (SEDE_PRINCIPAL_NO_INACTIVABLE).
 * - No se inactiva una sede con usuarios activos (SUCURSAL_TIENE_USUARIOS_ACTIVOS);
 *   el mensaje del backend ya incluye cuántos usuarios hay.
 */

import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { mensajeDeError } from '@/lib/forms/validacion';
import { sucursalesService } from '../api';
import type { Sucursal } from '../types';

const MENSAJES = {
  SEDE_PRINCIPAL_NO_INACTIVABLE: 'La Sede Principal es del sistema y no puede inactivarse.',
};

export function useCambiarEstadoSucursal(onCambiado: (s: Sucursal) => void) {
  const toast = useToast();
  const [objetivo, setObjetivo] = useState<Sucursal | null>(null);
  const [procesando, setProcesando] = useState(false);

  const solicitar = useCallback((sucursal: Sucursal) => setObjetivo(sucursal), []);
  const cancelar = useCallback(() => setObjetivo(null), []);

  const confirmar = useCallback(async () => {
    if (!objetivo) return;
    const activar = !objetivo.isActive;
    setProcesando(true);
    try {
      const actualizada = await sucursalesService.cambiarEstado(objetivo.id, activar);
      toast.success(`Sucursal "${objetivo.nombre}" ${activar ? 'activada' : 'inactivada'}.`);
      onCambiado(actualizada ?? { ...objetivo, isActive: activar });
      setObjetivo(null);
    } catch (error) {
      toast.error(mensajeDeError(error, MENSAJES));
    } finally {
      setProcesando(false);
    }
  }, [objetivo, onCambiado, toast]);

  return { objetivo, procesando, solicitar, cancelar, confirmar };
}
