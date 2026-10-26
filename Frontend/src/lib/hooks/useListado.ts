'use client';

/**
 * useListado.ts — Hook genérico para listas con filtros, búsqueda, orden y paginación.
 *
 * Dos modos:
 * - 'cliente' (por defecto): la API devuelve el arreglo completo (ej. GET /sucursales);
 *   búsqueda, orden y paginación se resuelven en memoria. Solo se vuelve a pedir
 *   cuando cambian los filtros.
 * - 'servidor': la API pagina (ej. GET /auditoria); cada cambio de página, orden o
 *   búsqueda dispara una nueva petición con esos parámetros.
 *
 * Ejemplo:
 *   const lista = useListado({
 *     cargar: ({ filtros }) => service.listar(filtros),
 *     filtrosIniciales: { sucursalId: undefined },
 *     buscar: (s, texto) => s.nombre.toLowerCase().includes(texto),
 *   });
 *   <DataTable rows={lista.rows} sort={lista.sort} onSortChange={lista.setSort} … />
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SortState } from '@/components/ui/DataTable';
import { normalizarPaginado, type RespuestaListado } from '@/lib/types/paginacion';
import { esAccesoDenegado, mensajeDeError } from '@/lib/forms/validacion';

export interface ContextoCarga<F> {
  filtros: F;
  page: number;
  limit: number;
  sort: SortState | null;
  busqueda: string;
}

interface OpcionesListado<T, F> {
  cargar: (ctx: ContextoCarga<F>) => Promise<RespuestaListado<T>>;
  filtrosIniciales: F;
  limit?: number;
  paginacion?: 'cliente' | 'servidor';
  sortInicial?: SortState | null;
  /** Filtro de texto local (modo cliente). Recibe el texto ya en minúsculas. */
  buscar?: (row: T, texto: string) => boolean;
  /** Valor de orden por columna (modo cliente). Por defecto usa row[key]. */
  valorOrden?: (row: T, key: string) => string | number | boolean | null | undefined;
}

export function useListado<T, F extends object>({
  cargar,
  filtrosIniciales,
  limit = 10,
  paginacion = 'cliente',
  sortInicial = null,
  buscar,
  valorOrden,
}: OpcionesListado<T, F>) {
  const [filtros, setFiltros] = useState<F>(filtrosIniciales);
  const [busqueda, setBusqueda] = useState('');
  const [sort, setSortState] = useState<SortState | null>(sortInicial);
  const [page, setPage] = useState(1);
  const [datos, setDatos] = useState<T[]>([]);
  const [totalServidor, setTotalServidor] = useState(0);
  const [paginasServidor, setPaginasServidor] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [denegado, setDenegado] = useState(false);
  const [recarga, setRecarga] = useState(0);

  const esServidor = paginacion === 'servidor';
  const cargarRef = useRef(cargar);
  const peticionActual = useRef(0);

  // Siempre usar la última versión de `cargar` sin que su identidad dispare peticiones
  useEffect(() => {
    cargarRef.current = cargar;
  });

  const filtrosKey = JSON.stringify(filtros);
  // En modo cliente, página/orden/búsqueda no disparan peticiones
  const claveServidor = esServidor ? `${page}|${sort?.key}|${sort?.direction}|${busqueda}` : '';

  useEffect(() => {
    const id = ++peticionActual.current;
    setLoading(true);
    setError(null);
    setDenegado(false);

    cargarRef
      .current({ filtros, page, limit, sort, busqueda })
      .then((raw) => {
        if (id !== peticionActual.current) return;
        const pag = normalizarPaginado(raw);
        setDatos(pag.items);
        setTotalServidor(pag.total);
        setPaginasServidor(Math.max(1, pag.totalPages));
      })
      .catch((err) => {
        if (id !== peticionActual.current) return;
        setError(mensajeDeError(err));
        setDenegado(esAccesoDenegado(err));
      })
      .finally(() => {
        if (id === peticionActual.current) setLoading(false);
      });
    // filtros/page/sort/busqueda quedan representados en filtrosKey y claveServidor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosKey, claveServidor, limit, recarga]);

  const procesados = useMemo(() => {
    if (esServidor) return datos;
    let resultado = datos;
    const texto = busqueda.trim().toLowerCase();
    if (texto && buscar) resultado = resultado.filter((row) => buscar(row, texto));
    if (sort) {
      const obtener = valorOrden ?? ((row: T, key: string) => (row as Record<string, unknown>)[key] as string | number);
      const factor = sort.direction === 'asc' ? 1 : -1;
      resultado = [...resultado].sort((a, b) => {
        const va = obtener(a, sort.key) ?? '';
        const vb = obtener(b, sort.key) ?? '';
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor;
        return String(va).localeCompare(String(vb), 'es', { numeric: true }) * factor;
      });
    }
    return resultado;
  }, [esServidor, datos, busqueda, buscar, sort, valorOrden]);

  const total = esServidor ? totalServidor : procesados.length;
  const totalPages = esServidor ? paginasServidor : Math.max(1, Math.ceil(procesados.length / limit));
  const paginaSegura = Math.min(page, totalPages);
  const rows = esServidor ? procesados : procesados.slice((paginaSegura - 1) * limit, paginaSegura * limit);

  const setFiltro = useCallback(<K extends keyof F>(clave: K, valor: F[K]) => {
    setFiltros((prev) => ({ ...prev, [clave]: valor }));
    setPage(1);
  }, []);

  const setSort = useCallback((nuevo: SortState) => {
    setSortState(nuevo);
    setPage(1);
  }, []);

  const cambiarBusqueda = useCallback((texto: string) => {
    setBusqueda(texto);
    setPage(1);
  }, []);

  const recargar = useCallback(() => setRecarga((n) => n + 1), []);

  return {
    rows,
    todos: procesados,
    datos,
    total,
    page: paginaSegura,
    totalPages,
    setPage,
    sort,
    setSort,
    filtros,
    setFiltro,
    busqueda,
    setBusqueda: cambiarBusqueda,
    loading,
    error,
    denegado,
    recargar,
  };
}
