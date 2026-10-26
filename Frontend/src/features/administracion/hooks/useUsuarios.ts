'use client';

/**
 * useUsuarios.ts — Directorio paginado de usuarios con filtros por rol, sucursal, estado y texto.
 *
 * La API pagina (modo 'servidor' de useListado); la búsqueda se envía con un retardo
 * de 350 ms para no disparar una petición por tecla. Los catálogos de roles y sucursales
 * se piden solo con el permiso de su ruta.
 */

import { useEffect, useState } from 'react';
import type { RolResumenDto } from '@warengine/contracts';
import { usePermissions } from '@/features/autenticacion';
import { useListado } from '@/lib/hooks/useListado';
import { useRecurso } from '@/lib/hooks/useRecurso';
import { sucursalesService, usuariosService } from '../api';
import { PERMISOS_ADMIN } from '../permisos';
import type { UsuarioGestionado } from '../types';

export type FiltroEstadoUsuario = 'todos' | 'activos' | 'inactivos';

export const FILTROS_ESTADO_USUARIO: { value: FiltroEstadoUsuario; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'activos', label: 'Activos' },
  { value: 'inactivos', label: 'Inactivos' },
];

interface FiltrosVista {
  rolId?: number;
  sucursalId?: number;
  estado: FiltroEstadoUsuario;
}

const RETARDO_BUSQUEDA_MS = 350;

export function useUsuarios() {
  const { tienePermiso } = usePermissions();
  const puede = {
    asignarRoles: tienePermiso(PERMISOS_ADMIN.asignarRoles),
    gestionarUsuarios: tienePermiso(PERMISOS_ADMIN.gestionarUsuarios),
    verSucursales: tienePermiso(PERMISOS_ADMIN.gestionarSucursales),
  };

  const lista = useListado<UsuarioGestionado, FiltrosVista>({
    paginacion: 'servidor',
    limit: 10,
    filtrosIniciales: { estado: 'todos' },
    cargar: ({ filtros, page, limit, busqueda }) =>
      usuariosService.listar({
        rolId: filtros.rolId,
        sucursalId: filtros.sucursalId,
        isActive: filtros.estado === 'todos' ? undefined : filtros.estado === 'activos' ? 'true' : 'false',
        busqueda: busqueda.trim() || undefined,
        pagina: page,
        limite: limit,
      }),
  });

  // Texto del buscador → búsqueda en servidor con retardo
  const [texto, setTexto] = useState('');
  const { setBusqueda } = lista;
  useEffect(() => {
    const id = setTimeout(() => setBusqueda(texto), RETARDO_BUSQUEDA_MS);
    return () => clearTimeout(id);
  }, [texto, setBusqueda]);

  const roles = useRecurso<RolResumenDto[]>(() => usuariosService.listarRoles(), [], { habilitado: puede.asignarRoles });
  const sucursales = useRecurso(() => sucursalesService.listar(), [], { habilitado: puede.verSucursales });

  return {
    ...lista,
    texto,
    setTexto,
    puede,
    roles: roles.data ?? [],
    sucursales: sucursales.data ?? [],
  };
}
