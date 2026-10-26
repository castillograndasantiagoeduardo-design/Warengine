'use client';

/**
 * useDashboardGlobal.ts — Estado y datos del dashboard del Super Admin.
 *
 * Cada bloque (KPIs, tendencias, rendimiento, ranking) se carga por separado:
 * si uno falla, los demás siguen visibles con su propio estado de error.
 */

import { useMemo, useState } from 'react';
import { useRecurso } from '@/lib/hooks/useRecurso';
import { rangoMesActual, rangoUltimosDias, type RangoFechas } from '@/lib/format/fecha';
import { dashboardService, sucursalesService, usuariosService } from '../api';
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
  const [rango, setRango] = useState<RangoPreset>('30d');
  const [sucursalId, setSucursalId] = useState<number | undefined>(undefined);
  const [agrupacion, setAgrupacion] = useState<AgrupacionTendencia>('dia');
  const [ordenRanking, setOrdenRanking] = useState<OrdenRanking>('mas_vendidos');

  // El rango se recalcula solo al cambiar el preset (no en cada render)
  const fechas = useMemo(() => resolverRango(rango), [rango]);
  const filtros: FiltrosDashboard = { ...fechas, sucursalId };
  const claveFiltros = [fechas.desde, fechas.hasta, sucursalId];

  const metricas = useRecurso(() => dashboardService.obtenerMetricas(filtros), claveFiltros);
  const tendencias = useRecurso(
    () => dashboardService.obtenerTendencias({ ...filtros, agrupacion }),
    [...claveFiltros, agrupacion],
  );
  const rendimiento = useRecurso(
    () => dashboardService.obtenerRendimiento({ ...fechas, sucursalIds: sucursalId ? [sucursalId] : undefined }),
    claveFiltros,
  );
  const ranking = useRecurso(
    () => dashboardService.obtenerRanking({ ...filtros, orden: ordenRanking, limite: 5 }),
    [...claveFiltros, ordenRanking],
  );

  // Datos de contexto que no dependen del rango de fechas
  const sucursales = useRecurso(() => sucursalesService.listar(), []);
  // Solo se necesitan los totales: se piden páginas de 1 elemento
  const usuarios = useRecurso(async () => {
    const [todos, activos] = await Promise.all([
      usuariosService.listar({ limite: 1 }),
      usuariosService.listar({ limite: 1, isActive: 'true' }),
    ]);
    return { totales: todos.total, activos: activos.total };
  }, []);
  const alertasStock = useRecurso(() => dashboardService.contarAlertasStock(sucursalId), [sucursalId]);

  const resumenOrganizacion = useMemo(() => {
    const listaSucursales = sucursales.data ?? [];
    return {
      sucursalesActivas: listaSucursales.filter((s) => s.isActive).length,
      sucursalesTotales: listaSucursales.length,
      usuariosActivos: usuarios.data?.activos ?? 0,
      usuariosTotales: usuarios.data?.totales ?? 0,
    };
  }, [sucursales.data, usuarios.data]);

  return {
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
    sucursales,
    usuarios,
    alertasStock,
    resumenOrganizacion,
  };
}
