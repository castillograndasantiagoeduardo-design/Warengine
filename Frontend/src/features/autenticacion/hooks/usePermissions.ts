'use client';

/**
 * usePermissions.ts — Hook para comprobaciones de autorización granular (RBAC).
 *
 * Facilita el renderizado condicional de botones, vistas y menús basado en
 * los permisos y roles asignados al usuario en la base de datos.
 */

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { ROLES } from '@warengine/contracts';

export function usePermissions() {
  const { usuario, permisos, tienePermiso, tieneRol } = useAuth();

  const esSuperAdmin = useMemo(
    () => usuario?.rolNombre === ROLES.SUPER_ADMIN || usuario?.rolId === 1,
    [usuario],
  );

  const esAdminSucursal = useMemo(
    () => usuario?.rolNombre === ROLES.ADMIN_SUCURSAL || usuario?.rolId === 2,
    [usuario],
  );

  const esCajero = useMemo(
    () => usuario?.rolNombre === ROLES.CAJERO || usuario?.rolId === 3,
    [usuario],
  );

  const esVendedorB2B = useMemo(
    () => usuario?.rolNombre === ROLES.VENDEDOR_B2B || usuario?.rolId === 4,
    [usuario],
  );

  const tieneCualquieraPermisos = (listaPermisos: string[]): boolean => {
    if (esSuperAdmin) return true;
    return listaPermisos.some((p) => permisos.includes(p));
  };

  const tieneTodosPermisos = (listaPermisos: string[]): boolean => {
    if (esSuperAdmin) return true;
    return listaPermisos.every((p) => permisos.includes(p));
  };

  return {
    usuario,
    permisos,
    rolActual: usuario?.rolNombre ?? null,
    esSuperAdmin,
    esAdminSucursal,
    esCajero,
    esVendedorB2B,
    tienePermiso,
    tieneRol,
    tieneCualquieraPermisos,
    tieneTodosPermisos,
  };
}
