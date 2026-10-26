'use client';

/**
 * usePanelMenu.ts — Filtra PANEL_MENU según los permisos reales de la sesión.
 */

import { useMemo } from 'react';
import { usePermissions } from '@/features/autenticacion';
import { PANEL_MENU, type PanelMenuItem } from './menu.config';

export function usePanelMenu(): PanelMenuItem[] {
  const { tieneCualquieraPermisos } = usePermissions();

  return useMemo(
    () =>
      PANEL_MENU.filter((item) => {
        if (!item.permiso) return true;
        return tieneCualquieraPermisos(Array.isArray(item.permiso) ? item.permiso : [item.permiso]);
      }),
    [tieneCualquieraPermisos],
  );
}
