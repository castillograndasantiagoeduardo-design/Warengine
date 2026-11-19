'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/autenticacion';
import { branchStaffService } from '../api/branch-staff.service';
import type { EmpleadoSede, EmpleadosFiltros } from '../types/branch-staff.types';

export interface UseBranchStaffOptions {
  sucursalId?: number;
}

export function useBranchStaff(options?: UseBranchStaffOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { usuario } = useAuth();

  const sucursalId = options?.sucursalId ?? usuario?.sucursalId ?? 1;

  // Parámetros leídos de URL
  const qParam = searchParams.get('q') || '';
  const cargoParam = searchParams.get('cargo') || '';
  const estadoParam = searchParams.get('estado') || ''; // 'activo' | 'inactivo' | ''
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  // Estado local para el input de búsqueda con debounce
  const [terminoBusqueda, setTerminoBusqueda] = useState(qParam);

  const [empleados, setEmpleados] = useState<EmpleadoSede[]>([]);
  const [perfilAdmin, setPerfilAdmin] = useState<EmpleadoSede | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ficha de detalle (drawer)
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<EmpleadoSede | null>(null);

  // Sincronizar búsqueda local si cambia la URL externamente
  useEffect(() => {
    setTerminoBusqueda(qParam);
  }, [qParam]);

  // Actualizador de parámetros en URL (empuja a página 1 si cambian filtros)
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

  // Carga de datos
  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const filtros: EmpleadosFiltros = {
        page,
        limite: 10,
      };
      if (qParam.trim()) filtros.q = qParam.trim();
      if (cargoParam.trim()) filtros.cargo = cargoParam.trim();
      if (estadoParam === 'activo') filtros.isActive = true;
      if (estadoParam === 'inactivo') filtros.isActive = false;

      const res = await branchStaffService.listarEmpleadosPaginado(sucursalId, filtros);
      setEmpleados(res.items);
      setTotal(res.total);
      setTotalPaginas(res.totalPaginas);

      const adminFound = res.items.find(
        (e) =>
          (e.cargo || '').toLowerCase().includes('administrador') ||
          (e.cargo || '').toLowerCase().includes('admin'),
      );
      if (adminFound) {
        setPerfilAdmin(adminFound);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al cargar colaboradores de la sede.');
    } finally {
      setCargando(false);
    }
  }, [sucursalId, page, qParam, cargoParam, estadoParam]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Debounce para búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      if (terminoBusqueda !== qParam) {
        actualizarParams({ q: terminoBusqueda, page: '1' });
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [terminoBusqueda, qParam, actualizarParams]);

  const cambiarPagina = (nuevaPagina: number) => {
    actualizarParams({ page: String(nuevaPagina) });
  };

  const cambiarCargo = (nuevoCargo: string) => {
    actualizarParams({ cargo: nuevoCargo, page: '1' });
  };

  const cambiarEstado = (nuevoEstado: string) => {
    actualizarParams({ estado: nuevoEstado, page: '1' });
  };

  const limpiarFiltros = () => {
    setTerminoBusqueda('');
    router.push(pathname);
  };

  const editarPerfilAdmin = useCallback(
    async (data: {
      telefono?: string;
      direccion?: string;
    }): Promise<{ ok: boolean; error?: string }> => {
      if (!perfilAdmin) {
        return { ok: false, error: 'No se encontró el registro laboral del administrador.' };
      }
      try {
        const actualizado = await branchStaffService.editarEmpleado(perfilAdmin.id, data);
        setPerfilAdmin(actualizado);
        setEmpleados((prev) => prev.map((e) => (e.id === perfilAdmin.id ? actualizado : e)));
        return { ok: true };
      } catch (err: any) {
        return {
          ok: false,
          error: err?.message || 'Error al actualizar el perfil del administrador.',
        };
      }
    },
    [perfilAdmin],
  );

  const hayFiltrosActivos = Boolean(qParam || cargoParam || estadoParam);

  return {
    empleados,
    total,
    totalPaginas,
    paginaActual: page,
    cargando,
    error,
    recargar: cargar,
    terminoBusqueda,
    setTerminoBusqueda,
    cargoActual: cargoParam,
    estadoActual: estadoParam,
    perfilAdmin,
    editarPerfilAdmin,
    cambiarPagina,
    cambiarCargo,
    cambiarEstado,
    limpiarFiltros,
    hayFiltrosActivos,
    empleadoSeleccionado,
    abrirFicha: setEmpleadoSeleccionado,
    cerrarFicha: () => setEmpleadoSeleccionado(null),
  };
}
