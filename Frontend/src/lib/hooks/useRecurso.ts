'use client';

/**
 * useRecurso.ts — Carga asíncrona de un recurso con estados de carga/error y recarga.
 *
 *   const { data, loading, error, recargar } = useRecurso(
 *     () => dashboardService.obtenerMetricas(filtros),
 *     [filtros.desde, filtros.hasta],
 *   );
 *
 * Descarta respuestas obsoletas si las dependencias cambian antes de que llegue la anterior.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { esAccesoDenegado, mensajeDeError } from '@/lib/forms/validacion';

export function useRecurso<T>(cargar: () => Promise<T>, deps: unknown[], opciones: { habilitado?: boolean } = {}) {
  const { habilitado = true } = opciones;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(habilitado);
  const [error, setError] = useState<string | null>(null);
  /** true cuando la API respondió 403: la vista debe mostrar el estado de acceso denegado. */
  const [denegado, setDenegado] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const cargarRef = useRef(cargar);
  const peticionActual = useRef(0);

  useEffect(() => {
    cargarRef.current = cargar;
  });

  useEffect(() => {
    if (!habilitado) {
      setLoading(false);
      return;
    }
    const id = ++peticionActual.current;
    setLoading(true);
    setError(null);
    setDenegado(false);

    cargarRef
      .current()
      .then((res) => {
        if (id === peticionActual.current) setData(res);
      })
      .catch((err) => {
        if (id !== peticionActual.current) return;
        setError(mensajeDeError(err));
        setDenegado(esAccesoDenegado(err));
      })
      .finally(() => {
        if (id === peticionActual.current) setLoading(false);
      });
    // Las dependencias las define quien llama, igual que en useEffect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, habilitado, recarga]);

  const recargar = useCallback(() => setRecarga((n) => n + 1), []);

  return { data, loading, error, denegado, recargar, setData };
}
