'use client';

/**
 * useBranchDashboard.ts — Hook para gestionar el estado reactivo del dashboard de sucursal.
 *
 * Principio SOLID: Single Responsibility Principle (SRP).
 * Encapsula la reactividad, llamadas al servicio, gestión de errores y auto-recarga
 * de métricas para aislar por completo la lógica de negocio de los componentes visuales.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BranchDashboardData, DashboardPeriodo } from '../types/branch-dashboard.types';
import { IBranchDashboardService } from '../api/branch-dashboard.interface';
import { branchDashboardService } from '../api/branch-dashboard.service';

interface UseBranchDashboardOptions {
  sucursalId: number;
  sucursalNombre: string;
  periodoInicial?: DashboardPeriodo;
  autoRefreshIntervalMs?: number; // Ej. 60000ms para refresco cada minuto
  service?: IBranchDashboardService;
}

export function useBranchDashboard({
  sucursalId,
  sucursalNombre,
  periodoInicial = 'hoy',
  autoRefreshIntervalMs = 0,
  service = branchDashboardService,
}: UseBranchDashboardOptions) {
  const [periodo, setPeriodo] = useState<DashboardPeriodo>(periodoInicial);
  const [data, setData] = useState<BranchDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const cargarDatos = useCallback(
    async (isSilent = false) => {
      if (!isSilent) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const resultado = await service.obtenerDashboard({ sucursalId, sucursalNombre, periodo });
        if (isMountedRef.current) {
          setData(resultado);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Error al cargar métricas de la sucursal');
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [service, sucursalId, sucursalNombre, periodo]
  );

  useEffect(() => {
    isMountedRef.current = true;
    cargarDatos(false);

    return () => {
      isMountedRef.current = false;
    };
  }, [cargarDatos]);

  // Intervalo opcional de refresco automático
  useEffect(() => {
    if (autoRefreshIntervalMs <= 0) return;

    const interval = setInterval(() => {
      cargarDatos(true);
    }, autoRefreshIntervalMs);

    return () => clearInterval(interval);
  }, [autoRefreshIntervalMs, cargarDatos]);

  const cambiarPeriodo = useCallback((nuevoPeriodo: DashboardPeriodo) => {
    setPeriodo(nuevoPeriodo);
  }, []);

  const recargar = useCallback(() => {
    return cargarDatos(false);
  }, [cargarDatos]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    periodo,
    cambiarPeriodo,
    recargar,
  };
}
