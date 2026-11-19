'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/autenticacion';
import { branchStaffService } from '../api/branch-staff.service';
import type {
  HistorialTurnosFiltros,
  TurnoCorteDetalle,
  TurnoHistorialItem,
} from '../types/branch-staff.types';

export type AtajoFecha = 'hoy' | '7d' | '30d' | 'personalizado';

export function useShiftHistory() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { usuario } = useAuth();
  const sucursalId = usuario?.sucursalId ?? 1;

  // Parámetros leídos de la URL
  const desdeParam = searchParams.get('desde') || '';
  const hastaParam = searchParams.get('hasta') || '';
  const cajeroParam = searchParams.get('cajero') || '';
  const tipoCierreParam = (searchParams.get('tipoCierre') as 'normal' | 'administrativo') || '';
  const conDiferenciaParam = searchParams.get('conDiferencia') === 'true';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const [turnos, setTurnos] = useState<TurnoHistorialItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de Detalle de Corte
  const [turnoSeleccionadoCorte, setTurnoSeleccionadoCorte] = useState<string | null>(null);
  const [corteDetalle, setCorteDetalle] = useState<TurnoCorteDetalle | null>(null);
  const [cargandoCorte, setCargandoCorte] = useState(false);
  const [errorCorte, setErrorCorte] = useState<string | null>(null);

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
      const filtros: HistorialTurnosFiltros = {
        page,
        limite: 10,
      };
      if (desdeParam) filtros.desde = desdeParam;
      if (hastaParam) filtros.hasta = hastaParam;
      if (cajeroParam) filtros.usuarioId = cajeroParam;
      if (tipoCierreParam) filtros.tipoCierre = tipoCierreParam;
      if (conDiferenciaParam) filtros.conDiferencia = true;

      const res = await branchStaffService.listarHistorialTurnos(sucursalId, filtros);
      setTurnos(res.items);
      setTotal(res.total);
      setTotalPaginas(res.totalPaginas);
    } catch (err: any) {
      setError(err?.message || 'Error al consultar el historial de turnos.');
    } finally {
      setCargando(false);
    }
  }, [sucursalId, page, desdeParam, hastaParam, cajeroParam, tipoCierreParam, conDiferenciaParam]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Manejo de atajos de fecha
  const aplicarAtajoFecha = (atajo: AtajoFecha) => {
    const hoy = new Date();
    const formato = (d: Date) => d.toISOString().split('T')[0];

    if (atajo === 'hoy') {
      const strHoy = formato(hoy);
      actualizarParams({ desde: strHoy, hasta: strHoy, page: '1' });
    } else if (atajo === '7d') {
      const d7 = new Date();
      d7.setDate(hoy.getDate() - 7);
      actualizarParams({ desde: formato(d7), hasta: formato(hoy), page: '1' });
    } else if (atajo === '30d') {
      const d30 = new Date();
      d30.setDate(hoy.getDate() - 30);
      actualizarParams({ desde: formato(d30), hasta: formato(hoy), page: '1' });
    } else {
      // Personalizado: limpia las fechas predefinidas si se desea
    }
  };

  const cambiarPagina = (nuevaPagina: number) => {
    actualizarParams({ page: String(nuevaPagina) });
  };

  const cambiarDesde = (val: string) => {
    actualizarParams({ desde: val || null, page: '1' });
  };

  const cambiarHasta = (val: string) => {
    actualizarParams({ hasta: val || null, page: '1' });
  };

  const cambiarCajero = (cajeroId: string) => {
    actualizarParams({ cajero: cajeroId, page: '1' });
  };

  const cambiarTipoCierre = (tipo: string) => {
    actualizarParams({ tipoCierre: tipo, page: '1' });
  };

  const toggleConDiferencia = () => {
    actualizarParams({ conDiferencia: conDiferenciaParam ? null : 'true', page: '1' });
  };

  const limpiarFiltros = () => {
    router.push(pathname);
  };

  // Abrir corte detalle
  const abrirCorte = async (turnoId: string) => {
    setTurnoSeleccionadoCorte(turnoId);
    setCorteDetalle(null);
    setCargandoCorte(true);
    setErrorCorte(null);
    try {
      const corte = await branchStaffService.obtenerCorteTurno(turnoId);
      setCorteDetalle(corte);
    } catch (err: any) {
      setErrorCorte(err?.message || 'Error al obtener el detalle del corte.');
    } finally {
      setCargandoCorte(false);
    }
  };

  const cerrarCorte = () => {
    setTurnoSeleccionadoCorte(null);
    setCorteDetalle(null);
    setErrorCorte(null);
  };

  const hayFiltrosActivos = Boolean(
    desdeParam || hastaParam || cajeroParam || tipoCierreParam || conDiferenciaParam,
  );

  return {
    turnos,
    total,
    totalPaginas,
    paginaActual: page,
    cargando,
    error,
    recargar: cargar,
    desde: desdeParam,
    hasta: hastaParam,
    cajeroActual: cajeroParam,
    tipoCierreActual: tipoCierreParam,
    conDiferencia: conDiferenciaParam,
    cambiarPagina,
    cambiarDesde,
    cambiarHasta,
    cambiarCajero,
    cambiarTipoCierre,
    toggleConDiferencia,
    aplicarAtajoFecha,
    limpiarFiltros,
    hayFiltrosActivos,
    turnoSeleccionadoCorte,
    corteDetalle,
    cargandoCorte,
    errorCorte,
    abrirCorte,
    cerrarCorte,
  };
}
