/**
 * branch-navigation.config.ts — Configuración centralizada de rutas, sidebar,
 * pestañas y feature flags del módulo Administrador de Sucursal.
 *
 * Para agregar un nuevo módulo al sidebar o una nueva pestaña a Inventario,
 * basta con añadir una entrada en los arreglos declarativos de este archivo.
 */

import type { DashboardPeriodo } from '../types/branch-dashboard.types';

/**
 * Feature flag: el buscador global del header (⌘ K) se oculta en Fase 0
 * hasta que se implemente su lógica de búsqueda transversal en una fase posterior.
 */
export const ENABLE_GLOBAL_SEARCH = false;

export type BranchNavCategory = 'MENÚ' | 'OPERACIONES' | 'SISTEMA';

export type BranchNavIconName =
  | 'dashboard'
  | 'facturacion'
  | 'inventario'
  | 'clientes'
  | 'personal'
  | 'activos'
  | 'reportes'
  | 'configuracion';

export interface BranchNavItemConfig {
  id: string;
  label: string;
  href: string;
  icon: BranchNavIconName;
  categoria: BranchNavCategory;
  /** Si es true, la ruta se marca activa solo en coincidencia exacta (ej. /admin-sucursal). */
  exact?: boolean;
}

export const BRANCH_NAV_CATEGORIES: readonly BranchNavCategory[] = [
  'MENÚ',
  'OPERACIONES',
  'SISTEMA',
] as const;

export const BRANCH_NAV_ITEMS: readonly BranchNavItemConfig[] = [
  // MENÚ
  {
    id: 'resumen',
    label: 'Dashboard',
    href: '/admin-sucursal',
    icon: 'dashboard',
    categoria: 'MENÚ',
    exact: true,
  },
  {
    id: 'facturacion',
    label: 'Facturación',
    href: '/admin-sucursal/facturacion',
    icon: 'facturacion',
    categoria: 'MENÚ',
  },
  {
    id: 'inventario',
    label: 'Inventario',
    href: '/admin-sucursal/inventario',
    icon: 'inventario',
    categoria: 'MENÚ',
  },
  {
    id: 'clientes',
    label: 'Clientes',
    href: '/admin-sucursal/clientes',
    icon: 'clientes',
    categoria: 'MENÚ',
  },
  // OPERACIONES
  {
    id: 'personal',
    label: 'Personal',
    href: '/admin-sucursal/personal',
    icon: 'personal',
    categoria: 'OPERACIONES',
  },
  {
    id: 'activos',
    label: 'Activos',
    href: '/admin-sucursal/activos',
    icon: 'activos',
    categoria: 'OPERACIONES',
  },
  {
    id: 'reportes',
    label: 'Reportes',
    href: '/admin-sucursal/reportes',
    icon: 'reportes',
    categoria: 'OPERACIONES',
  },
  // SISTEMA
  {
    id: 'configuracion',
    label: 'Configuración',
    href: '/admin-sucursal/configuracion',
    icon: 'configuracion',
    categoria: 'SISTEMA',
  },
] as const;

/**
 * Determina si un ítem del sidebar o una pestaña está activo según el pathname actual.
 * - Si `exact` es true (o si el href es la raíz `/admin-sucursal`), exige coincidencia exacta.
 * - En caso contrario, coincide con el href exacto o cualquier subruta (`${href}/...`),
 *   de modo que "Inventario" se mantiene activo en `/admin-sucursal/inventario/movimientos`
 *   y `/admin-sucursal/inventario/proveedores`.
 */
export function isBranchRouteActive(
  pathname: string,
  href: string,
  exact = false,
): boolean {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const cleanHref = href.replace(/\/+$/, '') || '/';

  if (exact || cleanHref === '/admin-sucursal') {
    return cleanPath === cleanHref;
  }
  return cleanPath === cleanHref || cleanPath.startsWith(`${cleanHref}/`);
}

export interface BranchTabItem {
  id: string;
  label: string;
  href: string;
  exact?: boolean;
  badge?: string | number;
}

/**
 * Pestañas de navegación del submódulo de Inventario (/admin-sucursal/inventario/**).
 * Preparado para agregar "Categorías" y "Transferencias" en fases posteriores editando este arreglo.
 */
export const INVENTORY_SECTION_TABS: readonly BranchTabItem[] = [
  {
    id: 'productos',
    label: 'Productos',
    href: '/admin-sucursal/inventario',
    exact: true,
  },
  {
    id: 'movimientos',
    label: 'Movimientos',
    href: '/admin-sucursal/inventario/movimientos',
  },
  {
    id: 'proveedores',
    label: 'Proveedores',
    href: '/admin-sucursal/inventario/proveedores',
  },
  {
    id: 'categorias',
    label: 'Categorías',
    href: '/admin-sucursal/inventario/categorias',
  },
] as const;

/**
 * Pestañas de navegación del submódulo de Facturación (/admin-sucursal/facturacion/**).
 */
export const INVOICING_SECTION_TABS: readonly BranchTabItem[] = [
  {
    id: 'facturas',
    label: 'Facturas',
    href: '/admin-sucursal/facturacion',
    exact: true,
  },
  {
    id: 'alertas',
    label: 'Alertas',
    href: '/admin-sucursal/facturacion/alertas',
  },
] as const;

/**
 * Pestañas de navegación del submódulo de Personal (/admin-sucursal/personal/**).
 */
export const STAFF_SECTION_TABS: readonly BranchTabItem[] = [
  {
    id: 'empleados',
    label: 'Empleados',
    href: '/admin-sucursal/personal',
    exact: true,
  },
  {
    id: 'turnos',
    label: 'Turnos activos',
    href: '/admin-sucursal/personal/turnos',
  },
  {
    id: 'historial',
    label: 'Historial',
    href: '/admin-sucursal/personal/historial',
  },
] as const;

/**
 * Pestañas de navegación del submódulo de Activos (/admin-sucursal/activos/**).
 */
export const ASSETS_SECTION_TABS: readonly BranchTabItem[] = [
  {
    id: 'activos',
    label: 'Activos',
    href: '/admin-sucursal/activos',
    exact: true,
  },
  {
    id: 'mantenimientos',
    label: 'Mantenimientos',
    href: '/admin-sucursal/activos/mantenimientos',
  },
  {
    id: 'categorias',
    label: 'Categorías',
    href: '/admin-sucursal/activos/categorias',
  },
] as const;

export const DEFAULT_DASHBOARD_PERIODO: DashboardPeriodo = 'hoy';
