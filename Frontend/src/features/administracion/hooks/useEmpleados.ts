'use client';

/**
 * useEmpleados.ts — Directorio de empleados con filtros por sucursal y estado (RF-ADM-C12).
 *
 * GET /administracion/empleados no pagina: búsqueda, orden y paginación en cliente.
 * Sucursal y estado se envían como query (listarEmpleadosQuerySchema).
 */

import { usePermissions } from '@/features/autenticacion';
import { useListado } from '@/lib/hooks/useListado';
import { useRecurso } from '@/lib/hooks/useRecurso';
import { empleadosService, sucursalesService } from '../api';
import { PERMISOS_ADMIN } from '../permisos';
import type { Empleado } from '../types';

export type FiltroEstadoEmpleado = 'todos' | 'activos' | 'inactivos';

export const FILTROS_ESTADO_EMPLEADO: { value: FiltroEstadoEmpleado; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'activos', label: 'Activos' },
  { value: 'inactivos', label: 'Inactivos' },
];

interface FiltrosVista {
  sucursalId?: number;
  estado: FiltroEstadoEmpleado;
}

const buscarEmpleado = (e: Empleado, texto: string) =>
  [e.nombre, e.numeroDocumento, e.cargo, e.areaNombre].some((c) => c?.toLowerCase().includes(texto));

export function useEmpleados() {
  const { tienePermiso } = usePermissions();
  const puedeVerSucursales = tienePermiso(PERMISOS_ADMIN.gestionarSucursales);

  const lista = useListado<Empleado, FiltrosVista>({
    cargar: ({ filtros }) =>
      empleadosService.listar({
        sucursalId: filtros.sucursalId,
        isActive: filtros.estado === 'todos' ? undefined : filtros.estado === 'activos',
      }),
    filtrosIniciales: { estado: 'activos' },
    sortInicial: { key: 'nombre', direction: 'asc' },
    limit: 10,
    buscar: buscarEmpleado,
  });

  // Solo quien gestiona sucursales puede listarlas para el filtro (el admin de sucursal ve la suya)
  const sucursales = useRecurso(() => sucursalesService.listar(), [], { habilitado: puedeVerSucursales });

  return { ...lista, sucursales: sucursales.data ?? [], puedeVerSucursales };
}
