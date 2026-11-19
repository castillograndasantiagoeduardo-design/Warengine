'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { branchAssetsService } from '../api/branch-assets.service';
import type {
  CategoriaActivoSede,
  CategoriasActivosFiltros,
  CrearCategoriaActivoDTO,
  EditarCategoriaActivoDTO,
} from '../types/branch-assets.types';

export function useAssetCategories() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const qParam = searchParams.get('q') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const [terminoBusqueda, setTerminoBusqueda] = useState(qParam);
  const [categorias, setCategorias] = useState<CategoriaActivoSede[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [categoriaParaEditar, setCategoriaParaEditar] = useState<CategoriaActivoSede | null>(null);

  useEffect(() => {
    setTerminoBusqueda(qParam);
  }, [qParam]);

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
      const filtros: CategoriasActivosFiltros = {
        page,
        limit: 20,
      };
      if (qParam.trim()) filtros.busqueda = qParam.trim();

      const res = await branchAssetsService.listarCategorias(filtros);
      setCategorias(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar las categorías de activos.');
    } finally {
      setCargando(false);
    }
  }, [qParam, page]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleBuscar = useCallback(
    (texto: string) => {
      setTerminoBusqueda(texto);
      actualizarParams({ q: texto || null, page: '1' });
    },
    [actualizarParams],
  );

  const handleCambiarPagina = useCallback(
    (nuevaPagina: number) => {
      actualizarParams({ page: String(nuevaPagina) });
    },
    [actualizarParams],
  );

  const crearCategoria = useCallback(
    async (datos: CrearCategoriaActivoDTO) => {
      const creada = await branchAssetsService.crearCategoria(datos);
      await cargar();
      return creada;
    },
    [cargar],
  );

  const editarCategoria = useCallback(
    async (id: number, datos: EditarCategoriaActivoDTO) => {
      const editada = await branchAssetsService.editarCategoria(id, datos);
      await cargar();
      return editada;
    },
    [cargar],
  );

  const cambiarEstado = useCallback(
    async (id: number, isActive: boolean) => {
      const act = await branchAssetsService.cambiarEstadoCategoria(id, isActive);
      await cargar();
      return act;
    },
    [cargar],
  );

  return {
    categorias,
    total,
    totalPages,
    page,
    cargando,
    error,
    filtros: {
      terminoBusqueda,
    },
    handlers: {
      handleBuscar,
      handleCambiarPagina,
      recargar: cargar,
    },
    modales: {
      isCreateOpen,
      setIsCreateOpen,
      categoriaParaEditar,
      setCategoriaParaEditar,
    },
    operaciones: {
      crearCategoria,
      editarCategoria,
      cambiarEstado,
    },
  };
}
