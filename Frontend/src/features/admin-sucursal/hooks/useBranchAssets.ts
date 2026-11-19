'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/autenticacion';
import { branchAssetsService } from '../api/branch-assets.service';
import type {
  ActivoSede,
  ActivosFiltros,
  ActivosResumen,
  CrearActivoDTO,
  EditarActivoDTO,
  EstadoActivo,
} from '../types/branch-assets.types';

export interface UseBranchAssetsOptions {
  sucursalId?: number;
}

export function useBranchAssets(options?: UseBranchAssetsOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { usuario } = useAuth();

  const sucursalId = options?.sucursalId ?? usuario?.sucursalId ?? 1;

  // Parámetros URL
  const qParam = searchParams.get('q') || '';
  const categoriaParam = searchParams.get('categoria') || '';
  const estadoParam = (searchParams.get('estado') || '') as EstadoActivo | '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  // Estado local para input con debounce
  const [terminoBusqueda, setTerminoBusqueda] = useState(qParam);

  const [activos, setActivos] = useState<ActivoSede[]>([]);
  const [resumen, setResumen] = useState<ActivosResumen | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de modales y drawer
  const [activoSeleccionado, setActivoSeleccionado] = useState<ActivoSede | null>(null);
  const [activoParaEditar, setActivoParaEditar] = useState<ActivoSede | null>(null);
  const [activoParaBaja, setActivoParaBaja] = useState<ActivoSede | null>(null);
  const [activoParaAsignar, setActivoParaAsignar] = useState<ActivoSede | null>(null);
  const [activoParaDevolver, setActivoParaDevolver] = useState<ActivoSede | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Sincronizar input con URL
  useEffect(() => {
    setTerminoBusqueda(qParam);
  }, [qParam]);

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
      const filtros: ActivosFiltros = {
        page,
        limit: 12,
      };
      if (qParam.trim()) filtros.busqueda = qParam.trim();
      if (categoriaParam && !isNaN(Number(categoriaParam))) {
        filtros.categoriaActivoId = Number(categoriaParam);
      }
      if (estadoParam) filtros.estado = estadoParam;

      const res = await branchAssetsService.listarActivos(sucursalId, filtros);
      setActivos(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      if (res.resumen) setResumen(res.resumen);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar los activos de la sede.');
    } finally {
      setCargando(false);
    }
  }, [sucursalId, qParam, categoriaParam, estadoParam, page]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Handlers
  const handleBuscar = useCallback(
    (texto: string) => {
      setTerminoBusqueda(texto);
      actualizarParams({ q: texto || null, page: '1' });
    },
    [actualizarParams],
  );

  const handleFiltrarCategoria = useCallback(
    (categoriaId: string) => {
      actualizarParams({ categoria: categoriaId || null, page: '1' });
    },
    [actualizarParams],
  );

  const handleFiltrarEstado = useCallback(
    (estado: string) => {
      actualizarParams({ estado: estado || null, page: '1' });
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
    setTerminoBusqueda('');
    actualizarParams({ q: null, categoria: null, estado: null, page: '1' });
  }, [actualizarParams]);

  // Acciones CRUD
  const crearActivo = useCallback(
    async (datos: Omit<CrearActivoDTO, 'sucursalId'>) => {
      const nuevo = await branchAssetsService.crearActivo({
        ...datos,
        sucursalId,
      });
      await cargar();
      return nuevo;
    },
    [sucursalId, cargar],
  );

  const editarActivo = useCallback(
    async (id: string, datos: EditarActivoDTO) => {
      const act = await branchAssetsService.editarActivo(id, datos);
      await cargar();
      if (activoSeleccionado?.id === id) {
        setActivoSeleccionado(act);
      }
      return act;
    },
    [cargar, activoSeleccionado],
  );

  const darBajaActivo = useCallback(
    async (id: string, motivo: string) => {
      const act = await branchAssetsService.darBajaActivo(id, { motivo });
      await cargar();
      if (activoSeleccionado?.id === id) {
        setActivoSeleccionado(act);
      }
      return act;
    },
    [cargar, activoSeleccionado],
  );

  const asignarEmpleado = useCallback(
    async (id: string, empleadoId: string, fechaEsperada?: string | null, obs?: string | null) => {
      await branchAssetsService.asignarEmpleado(id, {
        empleadoId,
        fechaDevolucionEsperada: fechaEsperada,
        observaciones: obs,
      });
      await cargar();
      if (activoSeleccionado?.id === id) {
        const fresco = await branchAssetsService.obtenerActivo(id);
        setActivoSeleccionado(fresco);
      }
    },
    [cargar, activoSeleccionado],
  );

  const asignarArea = useCallback(
    async (id: string, areaId: number, fechaEsperada?: string | null, obs?: string | null) => {
      await branchAssetsService.asignarArea(id, {
        areaId,
        fechaDevolucionEsperada: fechaEsperada,
        observaciones: obs,
      });
      await cargar();
      if (activoSeleccionado?.id === id) {
        const fresco = await branchAssetsService.obtenerActivo(id);
        setActivoSeleccionado(fresco);
      }
    },
    [cargar, activoSeleccionado],
  );

  const devolverActivo = useCallback(
    async (id: string, obs?: string | null) => {
      await branchAssetsService.devolverActivo(id, { observaciones: obs });
      await cargar();
      if (activoSeleccionado?.id === id) {
        const fresco = await branchAssetsService.obtenerActivo(id);
        setActivoSeleccionado(fresco);
      }
    },
    [cargar, activoSeleccionado],
  );

  return {
    activos,
    resumen,
    total,
    totalPages,
    page,
    cargando,
    error,
    filtros: {
      terminoBusqueda,
      categoriaActivoId: categoriaParam ? Number(categoriaParam) : undefined,
      estado: estadoParam || undefined,
    },
    handlers: {
      handleBuscar,
      handleFiltrarCategoria,
      handleFiltrarEstado,
      handleCambiarPagina,
      handleLimpiarFiltros,
      recargar: cargar,
    },
    modales: {
      activoSeleccionado,
      setActivoSeleccionado,
      activoParaEditar,
      setActivoParaEditar,
      activoParaBaja,
      setActivoParaBaja,
      activoParaAsignar,
      setActivoParaAsignar,
      activoParaDevolver,
      setActivoParaDevolver,
      isCreateOpen,
      setIsCreateOpen,
    },
    operaciones: {
      crearActivo,
      editarActivo,
      darBajaActivo,
      asignarEmpleado,
      asignarArea,
      devolverActivo,
    },
  };
}
