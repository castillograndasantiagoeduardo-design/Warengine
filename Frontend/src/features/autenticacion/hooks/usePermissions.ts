'use client';

/**
 * usePermissions.ts — Hook para comprobaciones de autorización granular (RBAC).
 *
 * La UI autoriza SIEMPRE por códigos de permiso (PERMISSIONS de @warengine/contracts),
 * evaluando la lista real que el backend entrega en la sesión, para todos los roles
 * (RF-SA-E4). El rol solo decide a qué pantalla se aterriza tras el login.
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { ROLES } from '@warengine/contracts';

export function usePermissions() {
  const { usuario, permisos, tienePermiso, tieneRol } = useAuth();

  const tieneCualquieraPermisos = useCallback(
    (listaPermisos: string[]): boolean => listaPermisos.some((p) => permisos.includes(p)),
    [permisos],
  );

  const tieneTodosPermisos = useCallback(
    (listaPermisos: string[]): boolean => listaPermisos.every((p) => permisos.includes(p)),
    [permisos],
  );

  // Indicadores de rol: SOLO para aterrizaje y etiquetas visibles, nunca para autorizar.
  const esSuperAdmin = useMemo(() => usuario?.rolNombre === ROLES.SUPER_ADMIN, [usuario]);
  const esAdminSucursal = useMemo(() => usuario?.rolNombre === ROLES.ADMIN_SUCURSAL, [usuario]);
  const esCajero = useMemo(() => usuario?.rolNombre === ROLES.CAJERO, [usuario]);
  const esVendedorB2B = useMemo(() => usuario?.rolNombre === ROLES.VENDEDOR_B2B, [usuario]);

  return {
    usuario,
    permisos,
    rolActual: usuario?.rolNombre ?? null,
    tienePermiso,
    tieneRol,
    tieneCualquieraPermisos,
    tieneTodosPermisos,
    /** @deprecated Solo para aterrizaje/etiquetas. Para mostrar u ocultar usa tienePermiso(PERMISSIONS.X). */
    esSuperAdmin,
    /** @deprecated Solo para aterrizaje/etiquetas. Para mostrar u ocultar usa tienePermiso(PERMISSIONS.X). */
    esAdminSucursal,
    /** @deprecated Solo para aterrizaje/etiquetas. Para mostrar u ocultar usa tienePermiso(PERMISSIONS.X). */
    esCajero,
    /** @deprecated Solo para aterrizaje/etiquetas. Para mostrar u ocultar usa tienePermiso(PERMISSIONS.X). */
    esVendedorB2B,
  };
}
