/**
 * menu.config.ts — Entradas del sidebar del panel administrativo.
 *
 * Cada entrada declara el permiso RBAC que la habilita (el mismo que exige la ruta
 * de la API que carga esa pantalla); usePanelMenu() filtra según los permisos de la
 * sesión. Para agregar un módulo (ej. inventario del admin de sucursal) basta con
 * añadir una entrada aquí y crear la ruta en src/app/(panel)/dashboard/<ruta>/page.tsx.
 */

import { PERMISSIONS } from '@warengine/contracts';

export interface PanelMenuItem {
  href: string;
  label: string;
  icon: string;
  /** Permiso requerido; si es un arreglo basta con tener cualquiera. Sin permiso = visible para todos. */
  permiso?: string | string[];
  /** Ruta aún no construida: se muestra deshabilitada con la etiqueta "Pronto". */
  proximamente?: boolean;
}

export const PANEL_MENU: PanelMenuItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: '◆' },
  { href: '/dashboard/sucursales', label: 'Sucursales', icon: '⌂', permiso: PERMISSIONS.ADMIN_GESTIONAR_SUCURSALES },
  { href: '/dashboard/usuarios', label: 'Usuarios y roles', icon: '⚿', permiso: PERMISSIONS.AUTH_MANAGE_USERS },
  { href: '/dashboard/empleados', label: 'Empleados', icon: '☺', permiso: PERMISSIONS.ADMIN_GESTIONAR_PERSONAL },
  { href: '/dashboard/auditoria', label: 'Auditoría', icon: '☰', permiso: PERMISSIONS.AUTH_VIEW_AUDIT },
  { href: '/dashboard/alertas', label: 'Alertas', icon: '⚠', permiso: PERMISSIONS.ADMIN_GESTIONAR_ALERTAS },
  { href: '/dashboard/cuenta', label: 'Mi cuenta', icon: '⚙', proximamente: true },
];
