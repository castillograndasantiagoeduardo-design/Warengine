'use client';

/**
 * usePanelMenu.ts — Filtra PANEL_MENU según los permisos del usuario autenticado.
 */

import { useMemo } from 'react';
import { usePermissions } from '@/features/autenticacion';
import { PANEL_MENU, type PanelMenuItem } from './menu.config';

export function usePanelMenu(): PanelMenuItem[] {
  const { permisos, esSuperAdmin } = usePermissions();

  return useMemo(
    () =>
      PANEL_MENU.filter((item) => {
        if (!item.permiso || esSuperAdmin) return true;
        const requeridos = Array.isArray(item.permiso) ? item.permiso : [item.permiso];
        return requeridos.some((p) => permisos.includes(p));
      }),
    [permisos, esSuperAdmin],
  );
}
