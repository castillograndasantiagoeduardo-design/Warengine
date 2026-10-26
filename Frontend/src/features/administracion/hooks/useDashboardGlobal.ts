'use client';

/**
 * useDashboardGlobal.ts — Estado y datos del dashboard del Super Admin.
 *
 * Cada bloque se pide solo si la sesión tiene el permiso que exige su ruta
 * (PERMISOS_ADMIN) y se carga por separado: si uno falla o da 403, los demás
 * siguen visibles con su propio estado.
 */

import { useMemo, useState } from 'react';
import { usePermissions } from '@/features/autenticacion';
import { useRecurso } from '@/lib/hooks/useRecurso';
import { rangoMesActual, rangoUltimosDias, type RangoFechas } from '@/lib/format/fecha';
import { dashboardService, sucursalesService } from '../api';
import { PERMISOS_ADMIN } from '../permisos';
import type { AgrupacionTendencia, FiltrosDashboard, OrdenRanking } from '../types';

export type RangoPreset = '7d' | '30d' | 'mes' | '90d';

export const RANGOS: { value: RangoPreset; label: string }[] = [
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: 'mes', label: 'Este mes' },
  { value: '90d', label: '90 días' },
];

function resolverRango(preset: RangoPreset): RangoFechas {
  if (preset === 'mes') return rangoMesActual();
  return rangoUltimosDias(preset === '7d' ? 7 : preset === '30d' ? 30 : 90);
}

export function useDashboardGlobal() {
  const { tienePermiso } = usePermissions();
  const puede = {
    metricas: tienePermiso(PERMISOS_ADMIN.verMetricasGlobales),
    tendencias: tienePermiso(PERMISOS_ADMIN.verTendencias),
    sucursales: tienePermiso(PERMISOS_ADMIN.gestionarSucursales),
    alertas: tienePermiso(PERMISOS_ADMIN.gestionarAlertas),
  };

  const [rango, setRango] = useState<RangoPreset>('30d');
  const [sucursalId, setSucursalId] = useState<number | undefined>(undefined);
  const [agrupacion, setAgrupacion] = useState<AgrupacionTendencia>('dia');
  const [ordenRanking, setOrdenRanking] = useState<OrdenRanking>('mas_vendidos');

  // El rango se recalcula solo al cambiar el preset (no en cada render)
  const fechas = useMemo(() => resolverRango(rango), [rango]);
  const filtros: FiltrosDashboard = { ...fechas, sucursalId };
  const claveFiltros = [fechas.desde, fechas.hasta, sucursalId];

  const metricas = useRecurso(() => dashboardService.obtenerMetricas(filtros), claveFiltros, { habilitado: puede.metricas });
  const tendencias = useRecurso(
    () => dashboardService.obtenerTendencias({ ...filtros, agrupacion }),
    [...claveFiltros, agrupacion],
    { habilitado: puede.tendencias },
  );
  const rendimiento = useRecurso(
    () => dashboardService.obtenerRendimiento({ ...fechas, sucursalIds: sucursalId ? [sucursalId] : undefined }),
    claveFiltros,
    { habilitado: puede.metricas },
  );
  const ranking = useRecurso(
    () => dashboardService.obtenerRanking({ ...filtros, orden: ordenRanking, limite: 5 }),
    [...claveFiltros, ordenRanking],
    { habilitado: puede.metricas },
  );

  // Contexto de la organización: el resumen global no depende del filtro de sucursal
  const resumen = useRecurso(() => dashboardService.obtenerResumen(fechas), [fechas.desde, fechas.hasta], {
    habilitado: puede.metricas,
  });
  const sucursales = useRecurso(() => sucursalesService.listar(), [], { habilitado: puede.sucursales });
  const alertasStock = useRecurso(() => dashboardService.contarAlertasStock(sucursalId), [sucursalId], {
    habilitado: puede.alertas,
  });

  return {
    puede,
    rango,
    setRango,
    sucursalId,
    setSucursalId,
    agrupacion,
    setAgrupacion,
    ordenRanking,
    setOrdenRanking,
    metricas,
    tendencias,
    rendimiento,
    ranking,
    resumen,
    sucursales,
    alertasStock,
  };
}
