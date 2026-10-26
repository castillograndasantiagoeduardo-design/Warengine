'use client';

/**
 * useSucursalDetalle.ts — Ficha consolidada de una sucursal (RF-ADM-C18).
 *
 * GET /administracion/sucursales/:id/detalle → detalleSucursalResponseSchema.
 * El "encargado" no es un campo de la sucursal: se deriva de los usuarios asignados
 * con rol admin-sucursal.
 */

import { useMemo } from 'react';
import { ROLES } from '@warengine/contracts';
import { useRecurso } from '@/lib/hooks/useRecurso';
import { sucursalesService } from '../api';
import type { Sucursal } from '../types';

export function useSucursalDetalle(id: number) {
  const valido = Number.isInteger(id) && id > 0;
  const detalle = useRecurso(() => sucursalesService.obtenerDetalle(id), [id], { habilitado: valido });

  const sucursal = useMemo<Sucursal | null>(() => {
    const d = detalle.data;
    return d ? { id: d.id, nombre: d.nombre, direccion: d.direccion, contacto: d.contacto, isActive: d.isActive } : null;
  }, [detalle.data]);

  const encargados = useMemo(
    () => (detalle.data?.usuariosAsignados ?? []).filter((u) => u.rolNombre === ROLES.ADMIN_SUCURSAL && u.isActive),
    [detalle.data],
  );

  return { ...detalle, valido, sucursal, encargados };
}
