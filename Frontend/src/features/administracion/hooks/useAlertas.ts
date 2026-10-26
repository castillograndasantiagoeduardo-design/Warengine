'use client';

/**
 * useAlertas.ts — Alertas administrativas (filtros + cambio de estado) y alertas de stock.
 *
 * Ambas rutas exigen administracion:gestionar-alertas; el backend acota por sede según el usuario.
 */

import { useCallback, useState } from 'react';
import { usePermissions } from '@/features/autenticacion';
import { useToast } from '@/components/ui/Toast';
import { mensajeDeError } from '@/lib/forms/validacion';
import { useListado } from '@/lib/hooks/useListado';
import { useRecurso } from '@/lib/hooks/useRecurso';
import { alertasService, sucursalesService } from '../api';
import { PERMISOS_ADMIN } from '../permisos';
import type { AlertaAdmin, AlertaStock, EstadoAlertaAdmin } from '../types';

export type FiltroEstadoAlerta = 'todas' | EstadoAlertaAdmin;

export const FILTROS_ESTADO_ALERTA: { value: FiltroEstadoAlerta; label: string }[] = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'visto', label: 'Vistas' },
  { value: 'atendido', label: 'Atendidas' },
  { value: 'todas', label: 'Todas' },
];

interface FiltrosAlertas {
  estado: FiltroEstadoAlerta;
  sucursalId?: number;
}

const PESO_PRIORIDAD = { urgente: 0, normal: 1 } as const;

export function useAlertasAdmin() {
  const toast = useToast();
  const { tienePermiso } = usePermissions();
  const lista = useListado<AlertaAdmin, FiltrosAlertas>({
    filtrosIniciales: { estado: 'pendiente' },
    limit: 8,
    cargar: async ({ filtros }) => {
      const alertas = await alertasService.listar({
        estado: filtros.estado === 'todas' ? undefined : filtros.estado,
        sucursalId: filtros.sucursalId,
      });
      // Urgentes primero y, dentro de cada prioridad, las más recientes
      return [...alertas].sort(
        (a, b) => PESO_PRIORIDAD[a.prioridad] - PESO_PRIORIDAD[b.prioridad] || b.fechaCreacion.localeCompare(a.fechaCreacion),
      );
    },
  });

  const sucursales = useRecurso(() => sucursalesService.listar(), [], { habilitado: tienePermiso(PERMISOS_ADMIN.gestionarSucursales) });
  const [procesando, setProcesando] = useState<string | null>(null);
  const { recargar } = lista;

  const cambiarEstado = useCallback(
    async (alerta: AlertaAdmin, estado: 'visto' | 'atendido') => {
      setProcesando(alerta.id);
      try {
        await alertasService.cambiarEstado(alerta.id, estado);
        toast.success(`Alerta "${alerta.motivo}" marcada como ${estado === 'visto' ? 'vista' : 'atendida'}.`);
        recargar();
      } catch (error) {
        toast.error(mensajeDeError(error));
      } finally {
        setProcesando(null);
      }
    },
    [toast, recargar],
  );

  return { ...lista, sucursales: sucursales.data ?? [], procesando, cambiarEstado };
}

export function useAlertasStock() {
  return useListado<AlertaStock, { sucursalId?: number }>({
    paginacion: 'servidor',
    limit: 10,
    filtrosIniciales: {},
    cargar: ({ filtros, page, limit }) => alertasService.listarStock({ page, limit, sucursalId: filtros.sucursalId }),
  });
}
