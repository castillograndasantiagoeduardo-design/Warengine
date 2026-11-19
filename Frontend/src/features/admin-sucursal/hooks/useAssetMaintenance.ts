'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/autenticacion';
import { branchAssetsService } from '../api/branch-assets.service';
import type {
  FinalizarMantenimientoDTO,
  MantenimientoSede,
  MantenimientosFiltros,
  MantenimientosResumen,
  RegistrarMantenimientoDTO,
  TipoMantenimiento,
} from '../types/branch-assets.types';

export interface UseAssetMaintenanceOptions {
  sucursalId?: number;
}

export function useAssetMaintenance(options?: UseAssetMaintenanceOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { usuario } = useAuth();

  const sucursalId = options?.sucursalId ?? usuario?.sucursalId ?? 1;

  // Parámetros URL
  const estadoParam = (searchParams.get('estado') || 'todos') as 'todos' | 'en_curso' | 'finalizado';
  const tipoParam = (searchParams.get('tipo') || '') as TipoMantenimiento | '';
  const desdeParam = searchParams.get('desde') || '';
  const hastaParam = searchParams.get('hasta') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const [mantenimientos, setMantenimientos] = useState<MantenimientoSede[]>([]);
  const [resumen, setResumen] = useState<MantenimientosResumen | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de modales
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [mantenimientoParaFinalizar, setMantenimientoParaFinalizar] = useState<MantenimientoSede | null>(null);

  // Actualizador de parámetros en URL
  const actualizarParams = useCallback(
    (nuevos: Record<string, string | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(nuevos).forEach(([k, v]) => {
        if (v === null || v === undefined || v === '') {
          params.delete(k);
        } else {
          params.set(k, v);
        }
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const filtros: MantenimientosFiltros = {
        page,
        limit: 12,
      };
      if (estadoParam && estadoParam !== 'todos') filtros.estado = estadoParam;
      if (tipoParam) filtros.tipo = tipoParam;
      if (desdeParam) filtros.desde = desdeParam;
      if (hastaParam) filtros.hasta = hastaParam;

      const res = await branchAssetsService.listarMantenimientos(sucursalId, filtros);
      setMantenimientos(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      if (res.resumen) setResumen(res.resumen);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar los mantenimientos.');
    } finally {
      setCargando(false);
    }
  }, [sucursalId, estadoParam, tipoParam, desdeParam, hastaParam, page]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Handlers
  const handleCambiarEstado = useCallback(
    (nuevoEstado: 'todos' | 'en_curso' | 'finalizado') => {
      actualizarParams({ estado: nuevoEstado === 'todos' ? null : nuevoEstado, page: '1' });
    },
    [actualizarParams],
  );

  const handleCambiarTipo = useCallback(
    (nuevoTipo: string) => {
      actualizarParams({ tipo: nuevoTipo || null, page: '1' });
    },
    [actualizarParams],
  );

  const handleCambiarFechas = useCallback(
    (desde: string | null, hasta: string | null) => {
      actualizarParams({ desde: desde || null, hasta: hasta || null, page: '1' });
    },
    [actualizarParams],
  );

  const handleCambiarPagina = useCallback(
    (nuevaPagina: number) => {
      actualizarParams({ page: String(nuevaPagina) });
    },
    [actualizarParams],
  );

  const handleLimpiarFiltros = useCallback(() => {
    actualizarParams({ estado: null, tipo: null, desde: null, hasta: null, page: '1' });
  }, [actualizarParams]);

  // Operaciones
  const registrarMantenimiento = useCallback(
    async (activoId: string, datos: RegistrarMantenimientoDTO) => {
      await branchAssetsService.registrarMantenimiento(activoId, datos);
      await cargar();
    },
    [cargar],
  );

  const finalizarMantenimiento = useCallback(
    async (id: string, datos: FinalizarMantenimientoDTO) => {
      await branchAssetsService.finalizarMantenimiento(id, datos);
      await cargar();
    },
    [cargar],
  );

  return {
    mantenimientos,
    resumen,
    total,
    totalPages,
    page,
    cargando,
    error,
    filtros: {
      estado: estadoParam,
      tipo: tipoParam || undefined,
      desde: desdeParam || undefined,
      hasta: hastaParam || undefined,
    },
    handlers: {
      handleCambiarEstado,
      handleCambiarTipo,
      handleCambiarFechas,
      handleCambiarPagina,
      handleLimpiarFiltros,
      recargar: cargar,
    },
    modales: {
      isRegisterOpen,
      setIsRegisterOpen,
      mantenimientoParaFinalizar,
      setMantenimientoParaFinalizar,
    },
    operaciones: {
      registrarMantenimiento,
      finalizarMantenimiento,
    },
  };
}
